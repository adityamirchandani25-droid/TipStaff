import { NextResponse } from "next/server";
import { z } from "zod";
import { CATEGORY_ORDER } from "@/lib/categories";
import { findNearbyWorkers } from "@/lib/geo";

/** Workers are only ever discoverable within this radius — see the feature
 * spec: "that worker's location gets added to a map for 50 mile radius". */
const MAX_RADIUS_MI = 50;

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(MAX_RADIUS_MI).default(MAX_RADIUS_MI),
  category: z.enum(CATEGORY_ORDER).optional(),
});

/** Public, unauthenticated — a customer sees nearby workers on the map
 * before deciding to book or even sign in, same as the existing /services
 * directory. Polled on an interval by the map component. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
    radius: url.searchParams.get("radius") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "lat and lng are required" },
      { status: 400 },
    );
  }

  const { lat, lng, radius, category } = parsed.data;
  try {
    const workers = await findNearbyWorkers(lat, lng, radius, category);
    // Public maps only need a useful neighborhood-level position. Rounding
    // avoids publishing a worker's exact GPS coordinates to anonymous users.
    const publicWorkers = workers.map((worker) => ({
      ...worker,
      lat: Math.round(worker.lat * 1_000) / 1_000,
      lng: Math.round(worker.lng * 1_000) / 1_000,
    }));
    return NextResponse.json(
      { workers: publicWorkers },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Nearby provider lookup failed", error);
    return NextResponse.json(
      { error: "Nearby availability is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
