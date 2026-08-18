export type ClientMetricEvent =
  | "started"
  | "human_verified"
  | "document_viewed"
  | "device_code_submitted"
  | "signin_submitted"
  | "completed";

export function trackMetric(event: ClientMetricEvent) {
  if (typeof window === "undefined") return;

  void fetch("/api/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {
    // Metrics are non-blocking and must never interrupt the training flow.
  });
}
