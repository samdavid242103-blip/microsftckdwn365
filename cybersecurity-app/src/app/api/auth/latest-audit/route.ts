import { NextResponse } from "next/server";
import { db } from "@/db";
import { authSessions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ success: false, error: "database_unavailable" }, { status: 500 });
    }

    const records = await db.select().from(authSessions).orderBy(desc(authSessions.createdAt)).limit(1);
    if (!records || records.length === 0) {
      return NextResponse.json({ success: false, error: "no_records" }, { status: 404 });
    }

    const latest = records[0];
    return NextResponse.json({
      success: true,
      ipAddress: latest.ipAddress || "N/A",
      city: latest.city || "Unknown City",
      state: latest.state || "Unknown State",
      country: latest.country || "Country unavailable",
      latitude: latest.latitude || "0.0",
      longitude: latest.longitude || "0.0",
      createdAt: latest.createdAt,
    });
  } catch (err) {
    console.error("Latest audit error:", err);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
