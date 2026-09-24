export async function recordVisibleCoachImpression(
  impressionId: string,
): Promise<boolean> {
  const response = await fetch("/api/coach/impressions", {
    method: "POST",
    body: JSON.stringify({ impressionId }),
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  });
  return response.ok;
}
