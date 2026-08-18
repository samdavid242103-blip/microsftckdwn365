import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { trackMetricServer } from "@/lib/metrics";
import { db } from "@/db";
import { sessionDebug } from "@/db/schema";

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

    // The access token is used only in memory for this authorized Graph request.
    let userCountry = "Country unavailable";
    let opaqueUserId: string | null = null;
    try {
      const idClaims = typeof data.id_token === "string" ? parseJwtClaims(data.id_token) : {};
      const subject = typeof idClaims.oid === "string"
        ? idClaims.oid
        : typeof idClaims.sub === "string"
          ? idClaims.sub
          : null;
      if (subject) opaqueUserId = sha256(subject);

      const graphRes = await fetch(
        "https://graph.microsoft.com/v1.0/me?$select=id,country,usageLocation,officeLocation",
        {
          headers: { Authorization: `Bearer ${data.access_token}` },
          cache: "no-store",
        },
      );

      if (graphRes.ok) {
        const profile = await graphRes.json();
        const rawCountry = profile.country || profile.usageLocation || profile.officeLocation;
        if (typeof rawCountry === "string" && rawCountry.trim()) {
          userCountry = rawCountry.trim();
        }
        if (!opaqueUserId && typeof profile.id === "string") {
          opaqueUserId = sha256(profile.id);
        }
      }
    } catch {
      // Return Country unavailable without logging profile data or credentials.
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

    // Tokens are intentionally omitted from the response and are not persisted.
    return noStoreJson({ status: "success", country: userCountry });
  } catch {
    return noStoreJson({ status: "error", error: "invalid_request" }, 400);
  }
}
