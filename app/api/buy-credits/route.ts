import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { addCredits } from "@/lib/credits";

/**
 * Purchase credits. In production, integrate Stripe:
 * - POST body: { priceId } or { amount }
 * - Create Stripe Checkout session or PaymentIntent
 * - On webhook (payment success), call addCredits and return
 *
 * This stub adds a fixed amount for testing (disable in prod or guard by env).
 */
export async function POST(request: Request) {
  let userId: string;
  try {
    userId = requireUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = typeof body.amount === "number" ? Math.floor(body.amount) : 100;
  if (amount < 1 || amount > 100000) {
    return NextResponse.json({ error: "amount must be between 1 and 100000" }, { status: 400 });
  }

  // TODO: Verify payment via Stripe webhook before adding credits.
  // This stub is for development only.
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_STUB_BUY_CREDITS) {
    return NextResponse.json(
      { error: "Use Stripe Checkout; stub disabled in production" },
      { status: 501 }
    );
  }

  await addCredits(userId, amount, "purchase");
  return NextResponse.json({ added: amount });
}
