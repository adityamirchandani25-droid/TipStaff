"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { getStripe, hasStripeConfig } from "@/lib/stripe";
import { estimatePriceRange } from "@/lib/pricing";
import { CATEGORY_ORDER, URGENCY_ORDER } from "@/lib/categories";

const inputSchema = z.object({
  category: z.enum(CATEGORY_ORDER),
  urgency: z.enum(URGENCY_ORDER),
});

export interface PaymentIntentResult {
  ok: boolean;
  error?: string;
  clientSecret?: string;
  /** Dollars, for display next to the card form. */
  amount?: number;
}

/**
 * Creates a Stripe PaymentIntent for the starting estimate of the chosen
 * service + timing. The amount is computed here, server-side, from the same
 * pricing table the UI shows — never trust a client-sent amount.
 */
export async function createPaymentIntent(input: unknown): Promise<PaymentIntentResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return { ok: false, error: "You need to log in first" };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Choose a service and timing first" };
  }

  if (!hasStripeConfig()) {
    return {
      ok: false,
      error: "Payments aren’t configured yet. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
    };
  }

  const { category, urgency } = parsed.data;
  const estimate = estimatePriceRange(category, urgency);
  const amount = Math.round(estimate.low * 100);

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { customerId: session.user.id, category, urgency },
    });
    if (!intent.client_secret) {
      return { ok: false, error: "Couldn’t start payment. Try again." };
    }
    return { ok: true, clientSecret: intent.client_secret, amount: estimate.low };
  } catch (error) {
    console.error("Stripe PaymentIntent creation failed", error);
    return { ok: false, error: "Couldn’t start payment. Try again." };
  }
}
