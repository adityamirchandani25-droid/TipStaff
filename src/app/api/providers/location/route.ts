import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

async function requireWorkerProvider() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROVIDER") return null;
  return prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true, approvalStatus: true },
  });
}

/** Worker's dashboard calls this on an interval (via watchPosition) while
 * "share my location" is on. A plain route handler rather than a server
 * action since it's polled every few seconds, not tied to a form submit. */
export async function POST(request: Request) {
  const provider = await requireWorkerProvider();
  if (!provider) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  if (provider.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Your account isn’t approved yet" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "lat/lng out of range" }, { status: 400 });
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      currentLat: parsed.data.lat,
      currentLng: parsed.data.lng,
      locationUpdatedAt: new Date(),
      isOnline: true,
    },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

/** "Stop sharing my location" — takes the worker off the customer-facing
 * map immediately without discarding their last known position. */
export async function DELETE() {
  const provider = await requireWorkerProvider();
  if (!provider) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  await prisma.provider.update({
    where: { id: provider.id },
    data: { isOnline: false },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
