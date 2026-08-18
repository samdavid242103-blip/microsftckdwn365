import { NextResponse } from "next/server";
import { isMetricEvent, recordMetric } from "@/lib/metrics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { event?: unknown };

    if (!isMetricEvent(body.event)) {
      return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
    }

    await recordMetric(body.event);
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
