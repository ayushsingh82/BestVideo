import { NextResponse } from "next/server";
import { addCredits } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook. Verifies signature with STRIPE_WEBHOOK_SECRET and credits
 * the user when a checkout session completes.
 *
 * Configure in Stripe dashboard: send `checkout.session.completed` to
 * https://<your-host>/api/webhook/stripe
 */
export async function POST(request: Request) {
  const stripe = await getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { userId?: string; credits?: string } | null;
      payment_status?: string;
    };
    const userId = session.metadata?.userId;
    const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : NaN;
    if (!userId || !Number.isFinite(credits) || credits <= 0) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: true, ignored: true });
    }
    await addCredits(userId, credits, "purchase");
  }

  return NextResponse.json({ ok: true });
}

// Stripe needs the raw body for signature verification, so disable parsing.
export const dynamic = "force-dynamic";
