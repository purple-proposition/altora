// Best-effort in-memory rate limiter. Vercel functions are ephemeral and can
// run as multiple concurrent instances, so this does NOT provide a hard
// guarantee the way a shared store (Upstash/Vercel KV) would — a determined
// attacker spread across cold starts/instances can still exceed the limit.
// It's a real deterrent against casual abuse/scripted hammering from a
// single warm instance, with zero new infra required; upgrade to a shared
// store if this app ever needs a hard guarantee.

const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so this doesn't grow unbounded over the
// life of a warm instance.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

// Returns true if the call is allowed, false if the key is over `limit`
// calls within the trailing `windowMs`.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}
