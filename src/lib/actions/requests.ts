"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations/request";
import { geocodeAddress } from "@/lib/geocode";
import { estimatePriceRange } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import type { ActionResult } from "@/lib/actions/auth";

export async function listMyAddresses() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") return [];
  return prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });
}

export async function listMyRequests() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") return [];
  return prisma.serviceRequest.findMany({
    where: { customerId: session.user.id },
    include: { address: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyRequest(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") return null;
  return prisma.serviceRequest.findFirst({
    where: { id, customerId: session.user.id },
    include: { address: true, payment: true },
  });
}

export async function createServiceRequest(
  input: unknown,
): Promise<ActionResult & { requestId?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") return { ok: false, error: "You need to log in first" };

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const data = parsed.data;

  // Payment happens before the request exists (no matching engine yet to
  // hang it off a Job), so it's verified here, server-side against Stripe,
  // rather than trusted from the client that just ran the card form.
  const { low, high, surgeMultiplier } = estimatePriceRange(data.category, data.urgency);
  const alreadyUsed = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: data.paymentIntentId },
    select: { id: true },
  });
  if (alreadyUsed) {
    return { ok: false, error: "That payment has already been used for a request." };
  }

  let intent;
  try {
    intent = await getStripe().paymentIntents.retrieve(data.paymentIntentId);
  } catch (error) {
    console.error("Stripe PaymentIntent lookup failed", error);
    return { ok: false, error: "Couldn’t verify your payment. Try again." };
  }
  if (
    intent.status !== "succeeded" ||
    intent.metadata.customerId !== session.user.id ||
    intent.amount !== Math.round(low * 100) ||
    intent.currency !== "usd"
  ) {
    return { ok: false, error: "Payment doesn’t match this request. Please pay again." };
  }

  let addressId = data.addressId;
  if (addressId) {
    const owned = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });
    if (!owned) return { ok: false, error: "That address could not be found" };
  } else {
    if (!data.newAddress) return { ok: false, error: "Add a service address" };
    const point = await geocodeAddress(data.newAddress);
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: data.newAddress.label,
        line1: data.newAddress.line1,
        line2: data.newAddress.line2,
        city: data.newAddress.city,
        state: data.newAddress.state,
        postalCode: data.newAddress.postalCode,
        lat: point.lat,
        lng: point.lng,
      },
    });
    addressId = address.id;
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceRequest.create({
      data: {
        customerId: session.user.id,
        addressId,
        category: data.category,
        description: data.description,
        photos: data.photos,
        urgency: data.urgency,
        priceEstimateLow: low,
        priceEstimateHigh: high,
        surgeMultiplier,
      },
    });
    await tx.payment.create({
      data: {
        requestId: created.id,
        amount: low,
        currency: intent.currency,
        stripePaymentIntentId: intent.id,
        status: "SUCCEEDED",
      },
    });
    return created;
  });

  revalidatePath("/dashboard");
  return { ok: true, requestId: request.id };
}
