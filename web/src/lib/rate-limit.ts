import { NextResponse } from "next/server";

/**
 * Per-IP sliding-window rate limiter for guest-facing POSTs (spam guard).
 *
 * Single-process only: counts live in memory, reset on restart, and are
 * not shared across instances. Fine for dev + single-instance hosting.
 * When the app scales horizontally, swap the Map for Redis/DB counters
 * behind the same `checkRateLimit` interface.
 */
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 5000;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  if (first) return first;
  // Direct connections carry no forwarding headers — all such callers share
  // one bucket. Documented limitation; still stops single-source floods.
  return "direct";
}

export interface RateLimit {
  limit: number;
  windowSeconds: number;
}

export function checkRateLimit(
  req: Request,
  key: string,
  { limit, windowSeconds }: RateLimit
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const bkey = `${key}:${clientIp(req)}`;
  const hits = (buckets.get(bkey) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(bkey, hits);
    const retryAfter = Math.ceil(
      (hits[0] + windowSeconds * 1000 - now) / 1000
    );
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  hits.push(now);
  buckets.set(bkey, hits);
  if (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next();
    if (!oldest.done) buckets.delete(oldest.value);
  }
  return { ok: true };
}

/** 429 + Retry-After, in the app's friendly error voice. */
export function rateLimitExceeded(retryAfter: number) {
  const res = NextResponse.json(
    {
      error: "Whoa, slow down ♡ Too many tries — please wait a bit.",
      retry_after: retryAfter,
    },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(retryAfter));
  return res;
}
