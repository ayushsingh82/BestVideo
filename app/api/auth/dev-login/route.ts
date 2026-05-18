import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";
import { grantSignupCredits } from "@/lib/credits";

/**
 * Dev-only login. Looks up or creates a user by email, then sets a signed
 * session cookie. Disabled in production unless AUTH_DEV_LOGIN=true.
 *
 * Body: { email: string }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_LOGIN !== "true") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 404 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, credits: 0 } });
    await grantSignupCredits(user.id);
  }

  const cookie = createSessionCookie(user.id);
  const res = NextResponse.json({ userId: user.id, email: user.email });
  res.cookies.set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
