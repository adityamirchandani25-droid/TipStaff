"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations/request";
import { geocodeAddress } from "@/lib/geocode";
import { estimatePriceRange } from "@/lib/pricing";
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
    include: { address: true },
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

  const { low, high, surgeMultiplier } = estimatePriceRange(data.category, data.urgency);

  const request = await prisma.serviceRequest.create({
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

  revalidatePath("/dashboard");
  return { ok: true, requestId: request.id };
}
