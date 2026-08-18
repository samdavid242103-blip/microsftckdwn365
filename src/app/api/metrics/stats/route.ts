import { NextResponse } from "next/server";
import { readMetricCounts } from "@/lib/metrics";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const configuredToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!configuredToken) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${configuredToken}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await readMetricCounts();
  const started = counts.started;
  const completed = counts.completed;

  return NextResponse.json({
    counts,
    completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
  });
}
