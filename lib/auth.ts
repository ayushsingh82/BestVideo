/**
 * Auth helpers. Three resolution sources, in order:
 *   1. `x-user-id` header (kept for API testing / scripts).
 *   2. Signed session cookie (set by /api/auth/dev-login or your real auth).
 *   3. Nothing — caller decides 401.
 *
 * Replace with NextAuth / Clerk / Lucia for production; the cookie format
 * here is a minimal HMAC stub so the rest of the app has something real to
 * read out of `request.cookies`.
 */

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "bv_session";
const SECRET = process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionCookie(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionCookie(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: string };
    return typeof data.uid === "string" ? data.uid : null;
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export function getUserIdFromRequest(request: Request): string | null {
  const header = request.headers.get("x-user-id");
  if (header) return header;
  return verifySessionCookie(readCookie(request, COOKIE_NAME));
}

export function requireUserId(request: Request): string {
  const id = getUserIdFromRequest(request);
  if (!id) {
    throw new Error("Unauthorized");
  }
  return id;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
