/**
 * Minimal Apify REST client (ADR 0016). Runs an actor synchronously and
 * returns its dataset items. Token comes from APIFY_TOKEN — server-side only.
 */

const APIFY_BASE = 'https://api.apify.com/v2';

export async function runActorSync(
  actorId: string,
  input: Record<string, unknown>,
  { token = process.env.APIFY_TOKEN, timeoutSecs = 300 }: { token?: string; timeoutSecs?: number } = {}
): Promise<Record<string, unknown>[]> {
  if (!token) {
    throw new Error('APIFY_TOKEN is not configured');
  }
  const url = `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=${timeoutSecs}&format=json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSecs + 30) * 1000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify run failed (${res.status}) for ${actorId}: ${body.slice(0, 400)}`);
  }
  const items = (await res.json()) as unknown;
  if (!Array.isArray(items)) {
    throw new Error(`Apify returned a non-array dataset for ${actorId}`);
  }
  return items as Record<string, unknown>[];
}
