import Stripe from "stripe";

let cached: Stripe | null = null;

/** Server-side Stripe client. Never import this from client code —
 * STRIPE_SECRET_KEY has no NEXT_PUBLIC_ prefix, so Next.js won't inline it
 * into a client bundle, but treat that as a backstop, not a plan. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set — payments are not configured.");
  }
  cached = new Stripe(secretKey);
  return cached;
}

export function hasStripeConfig() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
