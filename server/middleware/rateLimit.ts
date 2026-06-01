import type { Context, MiddlewareHandler } from "hono";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

const buckets = new Map<string, Bucket>();

function clientKey(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = c.req.header("x-real-ip");
  if (real) return real;
  return "unknown";
}

export const authRateLimit: MiddlewareHandler = async (c, next) => {
  const key = clientKey(c);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    return c.json({ error: "too many requests" }, 429);
  }
  bucket.count += 1;
  await next();
};

if (typeof setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, WINDOW_MS).unref?.();
}
