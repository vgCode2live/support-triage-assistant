// Naive in-memory per-IP rate limiter. Resets on server restart and isn't
// shared across instances - fine for a single Cloud Run container, not a
// substitute for a real distributed limiter if this ever scales out.
//
// TODO (Week 2+, out of scope per SPEC.md): this is a fixed-window counter
// scoped to one process's memory. If this needs to scale past a single
// instance, replace with a shared store (e.g. Redis) and a sliding-window
// (or token-bucket) algorithm so the limit holds across instances and isn't
// gameable at fixed-window boundaries.

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { allowed: true };
}
