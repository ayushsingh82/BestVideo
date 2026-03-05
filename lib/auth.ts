/**
 * Auth helpers — replace with your real auth (NextAuth, Clerk, etc.)
 * For now returns userId from header or session placeholder.
 */
export function getUserIdFromRequest(request: Request): string | null {
  // Placeholder: read from header (e.g. API key or session id).
  // In production use: getServerSession(), auth(), or similar.
  const header = request.headers.get("x-user-id");
  if (header) return header;
  return null;
}

export function requireUserId(request: Request): string {
  const id = getUserIdFromRequest(request);
  if (!id) {
    throw new Error("Unauthorized");
  }
  return id;
}
