"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations/request";
import { geocodeAddress } from "@/lib/geocode";
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
  const alreadyUsed = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: data.paymentIntentId },
    select: { request: { select: { id: true, customerId: true } } },
  });
  if (alreadyUsed) {
    if (alreadyUsed.request?.customerId === session.user.id) {
      return { ok: true, requestId: alreadyUsed.request.id };
    }
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
    intent.metadata.category !== data.category ||
    intent.metadata.urgency !== data.urgency ||
    intent.currency !== "usd"
  ) {
    return { ok: false, error: "Payment doesn’t match this request. Please pay again." };
  }

  // The estimate is fixed when the PaymentIntent is created. Reading the
  // signed server-side metadata prevents an after-hours boundary between
  // payment and save from changing the amount underneath the customer.
  const low = intent.amount / 100;
  const high = Number(intent.metadata.estimateHigh);
  const surgeMultiplier = Number(intent.metadata.surgeMultiplier);
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(high) ||
    !Number.isFinite(surgeMultiplier) ||
    low <= 0 ||
    high < low ||
    surgeMultiplier < 1
  ) {
    return { ok: false, error: "Payment estimate data is invalid. Contact support before paying again." };
  }

  let existingAddressId: string | undefined;
  let newAddressPoint: { lat: number; lng: number } | undefined;
  if (data.addressId) {
    const owned = await prisma.address.findFirst({
      where: { id: data.addressId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) return { ok: false, error: "That address could not be found" };
    existingAddressId = owned.id;
  } else {
    if (!data.newAddress) return { ok: false, error: "Add a service address" };
    try {
      newAddressPoint = await geocodeAddress(data.newAddress);
    } catch (error) {
      console.error("Service address geocoding failed", error);
      return { ok: false, error: "We couldn’t verify that service address. Check it and try again." };
    }
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      let addressId = existingAddressId;
      if (!addressId && data.newAddress && newAddressPoint) {
        const address = await tx.address.create({
          data: {
            userId: session.user.id,
            label: data.newAddress.label,
            line1: data.newAddress.line1,
            line2: data.newAddress.line2,
            city: data.newAddress.city,
            state: data.newAddress.state,
            postalCode: data.newAddress.postalCode,
            lat: newAddressPoint.lat,
            lng: newAddressPoint.lng,
          },
          select: { id: true },
        });
        addressId = address.id;
      }
      if (!addressId) throw new Error("Missing service address");

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
  } catch (error) {
    // A duplicate concurrent submission can lose the unique-key race after
    // the early lookup. Recover the request instead of showing a false error.
    const recovered = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: intent.id },
      select: { request: { select: { id: true, customerId: true } } },
    });
    if (recovered?.request?.customerId === session.user.id) {
      return { ok: true, requestId: recovered.request.id };
    }
    console.error("Paid service request persistence failed", error);
    return {
      ok: false,
      error: "Your payment is safe, but the request couldn’t be saved. Retry this step or contact support before paying again.",
    };
  }
}
