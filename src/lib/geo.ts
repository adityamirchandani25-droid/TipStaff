import { prisma, prismaSchema } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { ServiceCategory } from "@/lib/categories";

// @prisma/adapter-pg's `schema` option only qualifies table names in queries
// Prisma Client itself generates (see lib/prisma.ts) — raw SQL has to do it
// by hand, or it silently resolves against the connection's default
// search_path instead of the configured schema.
function table(name: string) {
  const qualified = prismaSchema ? `"${prismaSchema}"."${name}"` : `"${name}"`;
  return Prisma.raw(qualified);
}

export interface NearbyWorker {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string | null;
  categories: ServiceCategory[];
  bio: string | null;
  lat: number;
  lng: number;
  distanceMi: number;
  rating: number;
  ratingCount: number;
  jobsCompleted: number;
}

/** A location ping older than this is treated as stale — the worker likely
 * closed the tab without explicitly going offline. */
const STALE_AFTER_MINUTES = 5;

/** Online, approved workers within `radiusMi` of (lat, lng), nearest first.
 * Distance is great-circle (haversine) in miles — Prisma can't express a
 * radius query over two plain Float columns, so this drops to raw SQL. */
export async function findNearbyWorkers(
  lat: number,
  lng: number,
  radiusMi: number,
  category?: ServiceCategory,
): Promise<NearbyWorker[]> {
  const rows = await prisma.$queryRaw<NearbyWorker[]>(Prisma.sql`
    SELECT
      id, name, "companyId", "companyName", categories, bio, lat, lng,
      rating, "ratingCount", "jobsCompleted", "distanceMi"
    FROM (
      SELECT
        p.id,
        u.name,
        p."companyId",
        c.name AS "companyName",
        to_jsonb(p.categories) AS categories,
        p.bio,
        p."currentLat" AS lat,
        p."currentLng" AS lng,
        p.rating,
        p."ratingCount",
        p."jobsCompleted",
        p."serviceRadiusMi",
        (
          3959 * acos(
            least(1, greatest(-1,
              cos(radians(${lat})) * cos(radians(p."currentLat")) * cos(radians(p."currentLng") - radians(${lng}))
              + sin(radians(${lat})) * sin(radians(p."currentLat"))
            ))
          )
        ) AS "distanceMi"
      FROM ${table("Provider")} p
      JOIN ${table("User")} u ON u.id = p."userId"
      LEFT JOIN ${table("Company")} c ON c.id = p."companyId"
      WHERE p."isOnline" = ${Prisma.raw("true")}
        AND p."approvalStatus" = ${Prisma.raw("'APPROVED'")}
        AND p."currentLat" IS NOT NULL
        AND p."currentLng" IS NOT NULL
        AND p."locationUpdatedAt" > NOW() - (${STALE_AFTER_MINUTES} * INTERVAL '1 minute')
        ${category ? Prisma.sql`AND ${category} = ANY(p.categories::text[])` : Prisma.empty}
    ) nearby
    WHERE "distanceMi" <= ${radiusMi}
      AND "distanceMi" <= "serviceRadiusMi"
    ORDER BY "distanceMi" ASC
    LIMIT 100
  `);
  return rows;
}
