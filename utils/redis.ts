/**
 * Shared ioredis client for utils (rate limit, idempotency).
 * Returns null when REDIS_URL is not set, so callers fall back to in-memory.
 */

import IORedis, { type Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redis = null;
    return null;
  }

  const client = new IORedis(url, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });
  client.on("error", (err) => {
    console.error("Redis error (utils):", err.message);
  });
  globalForRedis.redis = client;
  return client;
}
