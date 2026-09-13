import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await setPaymentStatus(event.data.object.id, "SUCCEEDED");
    } else if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      await setPaymentStatus(event.data.object.id, "FAILED");
    } else if (event.type === "charge.refunded") {
      const paymentIntent = event.data.object.payment_intent;
      const paymentIntentId =
        typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
      if (paymentIntentId) await setPaymentStatus(paymentIntentId, "REFUNDED");
    }
  } catch (error) {
    console.error("Stripe webhook persistence failed", { eventId: event.id, type: event.type, error });
    // A non-2xx response tells Stripe to retry the signed event.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json(
    { received: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

async function setPaymentStatus(
  stripePaymentIntentId: string,
  status: "SUCCEEDED" | "FAILED" | "REFUNDED",
) {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId },
    data: { status },
  });
}
