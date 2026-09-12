import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  const schema = databaseSchema(connectionString);
  const adapter = new PrismaPg(
    { connectionString },
    schema ? { schema } : undefined,
  );
  return new PrismaClient({ adapter });
}

function databaseSchema(connectionString?: string) {
  if (!connectionString) return undefined;

  try {
    return new URL(connectionString).searchParams.get("schema") ?? undefined;
  } catch {
    return undefined;
  }
}

// Reuse the client across hot reloads in dev so we don't exhaust the
// Postgres connection pool on every file save.
export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// The adapter's `schema` option (above) only affects queries Prisma Client
// itself generates — raw SQL (see lib/geo.ts) has to qualify table names
// with the same schema by hand. Exported so callers stay in sync with it.
export const prismaSchema = databaseSchema(process.env.DATABASE_URL);
