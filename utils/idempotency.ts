/**
 * Idempotency cache. Stores the JSON response previously returned for a given
 * (userId, key) pair so repeats return the same result instead of creating
 * duplicate jobs / double-charging.
 *
 * Backend: Redis when REDIS_URL is set, otherwise in-process Map.
 */

import { getRedis } from "./redis";

const TTL_SECONDS = 60 * 60 * 24; // 24h

interface MemEntry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, MemEntry>();

function memKey(userId: string, key: string): string {
  return `idem:${userId}:${key}`;
}

function sweepMemory() {
  const now = Date.now();
  for (const [k, v] of memory) {
    if (v.expiresAt <= now) memory.delete(k);
  }
}

/** Look up a previously-stored response, or null if none / expired. */
export async function getIdempotent<T>(userId: string, key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get(memKey(userId, key));
    return raw ? (JSON.parse(raw) as T) : null;
  }
  sweepMemory();
  const entry = memory.get(memKey(userId, key));
  if (!entry) return null;
  return JSON.parse(entry.value) as T;
}

/** Store the response we just returned, keyed by (userId, key). */
export async function setIdempotent<T>(userId: string, key: string, value: T): Promise<void> {
  const payload = JSON.stringify(value);
  const redis = getRedis();
  if (redis) {
    await redis.set(memKey(userId, key), payload, "EX", TTL_SECONDS);
    return;
  }
  memory.set(memKey(userId, key), {
    value: payload,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

/**
 * Read the idempotency key from a request. Accepts the `Idempotency-Key`
 * header (preferred) or an `idempotencyKey` field in the JSON body.
 */
export function getIdempotencyKey(
  request: Request,
  body?: { idempotencyKey?: unknown }
): string | null {
  const header = request.headers.get("idempotency-key");
  if (header && typeof header === "string" && header.length <= 200) {
    return header;
  }
  if (body && typeof body.idempotencyKey === "string" && body.idempotencyKey.length <= 200) {
    return body.idempotencyKey;
  }
  return null;
}
