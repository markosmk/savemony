import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(options: { windowMs: number; max: number }) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const entry = store.get(key);
    if (entry && now < entry.resetTime) {
      if (entry.count >= options.max) {
        return c.json({ error: "Too many requests" }, 429);
      }
      entry.count++;
    } else {
      store.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    }

    await next();
  };
}
