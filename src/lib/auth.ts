import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER } from "@/lib/categories";
import { normalizePhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/generated/prisma/enums";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: Role;
  };
}

export interface AccountProfile {
  id: string;
  role: Role;
}

export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    const authUserId = data?.claims?.sub;
    if (error || typeof authUserId !== "string") return null;

    const authEmail =
      typeof data?.claims?.email === "string"
        ? data.claims.email.trim().toLowerCase()
        : null;

    const user = await findSessionUser(authUserId, authEmail);
    return user ? { user } : null;
  } catch {
    return null;
  }
}

export async function ensureAccountProfile(
  authUser: SupabaseUser,
  requestedRole: "CUSTOMER" | "PROVIDER" | "COMPANY",
): Promise<AccountProfile | null> {
  const email = authUser.email?.trim().toLowerCase();
  const existing = await findAccountProfile(authUser.id, email);
  if (existing || !email) return existing;

  const metadata = authUser.user_metadata;
  const metadataRole = metadata.account_role;
  const role =
    metadataRole === "CUSTOMER" || metadataRole === "PROVIDER" || metadataRole === "COMPANY"
      ? metadataRole
      : requestedRole;
  const metadataCategory = metadata.category;
  const category = CATEGORY_ORDER.find((item) => item === metadataCategory);
  const metadataPhone =
    typeof metadata.phone === "string" ? normalizePhone(metadata.phone) : null;
  const name =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : email.split("@")[0];

  try {
    return await prisma.user.create({
      data: {
        id: authUser.id,
        name,
        email,
        phone: metadataPhone,
        emailVerified: authUser.email_confirmed_at
          ? new Date(authUser.email_confirmed_at)
          : null,
        role,
        ...(role === "PROVIDER"
          ? {
              provider: {
                create: {
                  categories: [category ?? "OTHER"],
                  approvalStatus: "PENDING",
                },
              },
            }
          : {}),
        ...(role === "COMPANY" ? { company: { create: { name, phone: metadataPhone } } } : {}),
      },
      select: { id: true, role: true },
    });
  } catch (error) {
    const recovered = await findAccountProfile(authUser.id, email);
    if (recovered) return recovered;
    console.error("Authenticated Supabase user profile recovery failed", error);
    throw error;
  }
}

async function findSessionUser(authUserId: string, email: string | null) {
  const userById = await prisma.user.findUnique({
    where: { id: authUserId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
  if (userById || !email) return userById;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

async function findAccountProfile(
  authUserId: string,
  email: string | null | undefined,
) {
  const profileById = await prisma.user.findUnique({
    where: { id: authUserId },
    select: { id: true, role: true },
  });
  if (profileById || !email) return profileById;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
}
