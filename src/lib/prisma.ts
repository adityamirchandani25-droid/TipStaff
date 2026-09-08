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
