/**
 * Fixed-window rate limiter. Counts requests per (identifier, route) within
 * a window; returns whether the request is allowed and the seconds to retry.
 *
 * Backend: Redis when REDIS_URL is set, otherwise in-process Map.
 *
 * Identifier should be the userId when authenticated, falling back to IP.
 */

import { getRedis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
  limit: number;
}

interface MemBucket {
  count: number;
  resetAt: number; // ms epoch
}

const memory = new Map<string, MemBucket>();

function bucketKey(scope: string, id: string, windowStart: number): string {
  return `rl:${scope}:${id}:${windowStart}`;
}

export interface RateLimitOptions {
  /** Window length in seconds. */
  windowSeconds: number;
  /** Maximum requests allowed in the window. */
  max: number;
  /** Logical scope, e.g. route name. */
  scope: string;
}

export async function rateLimit(
  identifier: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const key = bucketKey(opts.scope, identifier, windowStart);

  const redis = getRedis();
  let count: number;
  if (redis) {
    count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }
  } else {
    const bucket = memory.get(key) ?? { count: 0, resetAt };
    bucket.count += 1;
    memory.set(key, bucket);
    count = bucket.count;
    // Sweep stale buckets occasionally
    if (memory.size > 1000) {
      for (const [k, v] of memory) {
        if (v.resetAt <= now) memory.delete(k);
      }
    }
  }

  const remaining = Math.max(0, opts.max - count);
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
  return {
    allowed: count <= opts.max,
    remaining,
    retryAfter,
    limit: opts.max,
  };
}

/**
 * Derive a stable identifier for the caller: userId when present, else the
 * first IP in x-forwarded-for, else "anon".
 */
export function getRequestIdentifier(request: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return `ip:${fwd.split(",")[0].trim()}`;
  const real = request.headers.get("x-real-ip");
  if (real) return `ip:${real}`;
  return "anon";
}
