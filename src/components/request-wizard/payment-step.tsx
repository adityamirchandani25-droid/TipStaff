"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, LockKeyhole } from "lucide-react";
import { createPaymentIntent } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import type { ServiceCategory, UrgencyLevel } from "@/lib/categories";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

/**
 * Creates the PaymentIntent for this category/timing, then renders Stripe's
 * embedded card form. `onPaid` fires once Stripe confirms the charge
 * succeeded — the caller still has to actually create the service request
 * with that payment intent id, which is verified again server-side.
 */
export function PaymentStep({
  category,
  urgency,
  onPaid,
}: {
  category: ServiceCategory;
  urgency: UrgencyLevel;
  onPaid: (paymentIntentId: string) => Promise<void>;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRequestId = useId();

  useEffect(() => {
    let cancelled = false;
    // Step 4 (where this mounts) is fully torn down whenever the customer
    // edits the service or timing — going "back" to steps 0/2 unmounts this
    // component rather than changing its props in place — so there's no
    // stale-state case to clear here; a fresh mount already starts at null.
    createPaymentIntent({ category, urgency, clientRequestId }).then((result) => {
      if (cancelled) return;
      if (!result.ok || !result.clientSecret) {
        setError(result.error ?? "Couldn’t start payment.");
        return;
      }
      setClientSecret(result.clientSecret);
      setAmount(result.amount ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [category, urgency, clientRequestId]);

  if (error) {
    return <p role="alert" className="text-[13px] text-red-600">{error}</p>;
  }
  if (!clientSecret) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing payment…
      </div>
    );
  }

  return (
    <Elements stripe={getStripePromise()} options={{ clientSecret }}>
      <CheckoutForm amount={amount} onPaid={onPaid} />
    </Elements>
  );
}

function CheckoutForm({ amount, onPaid }: { amount: number | null; onPaid: (paymentIntentId: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Check your payment details and try again.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Try again.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      await onPaid(paymentIntent.id);
      // If saving failed after payment, allow a safe retry. The server treats
      // the PaymentIntent as an idempotency key and will never charge it twice.
      setSubmitting(false);
      return;
    }
    setError("Payment didn’t complete. Try again.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={!stripe || submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Processing payment…" : amount ? `Pay $${amount} & send request` : "Pay & send request"}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-ink-500">
        <LockKeyhole size={13} /> Charged now for the starting estimate. Parts and extra time are settled with your pro.
      </p>
    </form>
  );
}
