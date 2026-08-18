import { NextResponse } from "next/server";
import { db } from "@/db";
import { authSessions } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const secretKey = process.env.ADMIN_SECRET_KEY || "manus_secret_123";

  // Simple security check
  if (!key || key !== secretKey) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const sessions = await db.select().from(authSessions).orderBy(desc(authSessions.createdAt));
    
    // Return as JSON file download
    return new NextResponse(JSON.stringify(sessions, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="auth_sessions_export.json"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
