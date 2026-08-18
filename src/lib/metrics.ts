import { count } from "drizzle-orm";
import { db } from "@/db";
import { trainingEvents } from "@/db/schema";

export const METRIC_EVENTS = [
  "started",
  "human_verified",
  "document_viewed",
  "device_code_submitted",
  "signin_submitted",
  "completed",
  "oauth_success",
] as const;

export type MetricEvent = (typeof METRIC_EVENTS)[number];

type MetricCounts = Record<MetricEvent, number>;

const emptyCounts = (): MetricCounts =>
  Object.fromEntries(METRIC_EVENTS.map((event) => [event, 0])) as MetricCounts;

const globalForMetrics = globalThis as typeof globalThis & {
  __anonymousMetricCounts?: MetricCounts;
};

const memoryCounts =
  globalForMetrics.__anonymousMetricCounts ?? (globalForMetrics.__anonymousMetricCounts = emptyCounts());

export function isMetricEvent(value: unknown): value is MetricEvent {
  return typeof value === "string" && (METRIC_EVENTS as readonly string[]).includes(value);
}

export async function trackMetricServer(event: MetricEvent) {
  return recordMetric(event);
}

export async function recordMetric(event: MetricEvent) {
  memoryCounts[event] += 1;

  try {
    await db.insert(trainingEvents).values({ event });
  } catch (error) {
    // The in-memory counter keeps local previews usable when DATABASE_URL is
    // not configured or a development database is temporarily unavailable.
    console.warn("Anonymous metrics database write skipped:", error instanceof Error ? error.message : error);
  }
}

export async function readMetricCounts(): Promise<MetricCounts> {
  try {
    const rows = await db
      .select({ event: trainingEvents.event, total: count() })
      .from(trainingEvents)
      .groupBy(trainingEvents.event);

    const counts = emptyCounts();
    for (const row of rows) {
      if (isMetricEvent(row.event)) counts[row.event] = Number(row.total);
    }
    return counts;
  } catch (error) {
    console.warn("Anonymous metrics database read skipped:", error instanceof Error ? error.message : error);
    return { ...memoryCounts };
  }
}

export async function readRecentMetricCounts(): Promise<MetricCounts> {
  // The dashboard currently reports all-time counts. A retention policy can be
  // added later without changing the anonymous event contract.
  return readMetricCounts();
}
