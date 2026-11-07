import "server-only";

/**
 * Sliding-window rate limit per key (IP), in memory. Brief §13: 5 submissions per hour per IP.
 * On serverless this is per instance, which is still a useful brake; Supabase mode can add a
 * table-backed check later without changing callers.
 */
const windows = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 3_600_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  windows.set(key, hits);
  if (windows.size > 10_000) windows.clear();
  return { ok: true, remaining: limit - hits.length };
}
