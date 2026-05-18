/**
 * Lazy Stripe client. Returns null when STRIPE_SECRET_KEY is unset so the
 * rest of the app can fall back to the dev stub.
 */

import type Stripe from "stripe";

let cached: Stripe | null | undefined;

export async function getStripe(): Promise<Stripe | null> {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    cached = null;
    return null;
  }
  const StripeMod = (await import("stripe")).default;
  cached = new StripeMod(key);
  return cached;
}

/**
 * Cents charged per credit. Default $0.05 → 100 credits = $5.
 * Override via STRIPE_PRICE_PER_CREDIT_CENTS.
 */
export function pricePerCreditCents(): number {
  const v = parseInt(process.env.STRIPE_PRICE_PER_CREDIT_CENTS ?? "5", 10);
  return Number.isFinite(v) && v > 0 ? v : 5;
}
