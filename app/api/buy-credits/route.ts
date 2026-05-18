import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { addCredits } from "@/lib/credits";
import { prisma } from "@/lib/db";
import { getStripe, pricePerCreditCents } from "@/lib/stripe";

/**
 * Buy credits.
 *
 * When STRIPE_SECRET_KEY is set:
 *   Creates a Stripe Checkout Session and returns its URL. Credits are added
 *   asynchronously by /api/webhook/stripe on `checkout.session.completed`.
 *
 * When STRIPE_SECRET_KEY is unset (dev):
 *   Adds credits immediately. Guarded in production unless
 *   ALLOW_STUB_BUY_CREDITS=true.
 *
 * Body: { amount: number }   — number of credits to buy (1..100000).
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

  const stripe = await getStripe();

  if (stripe) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const unitAmount = pricePerCreditCents();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `BestVideo credits` },
            unit_amount: unitAmount,
          },
          quantity: amount,
        },
      ],
      success_url: `${origin}/create-video?purchase=success`,
      cancel_url: `${origin}/create-video?purchase=cancel`,
      customer_email: user?.email,
      metadata: { userId, credits: String(amount) },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  }

  // Dev stub
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_STUB_BUY_CREDITS !== "true") {
    return NextResponse.json(
      { error: "Configure STRIPE_SECRET_KEY or set ALLOW_STUB_BUY_CREDITS=true" },
      { status: 501 }
    );
  }

  await addCredits(userId, amount, "purchase");
  return NextResponse.json({ added: amount, stub: true });
}
