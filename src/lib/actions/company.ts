"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { addWorkerSchema } from "@/lib/validations/company";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/actions/auth";

async function requireCompany() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") return null;
  return prisma.company.findUnique({ where: { userId: session.user.id } });
}

export async function listCompanyWorkers() {
  const company = await requireCompany();
  if (!company) return [];
  return prisma.provider.findMany({
    where: { companyId: company.id },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function addCompanyWorker(input: unknown): Promise<ActionResult> {
  const company = await requireCompany();
  if (!company) return { ok: false, error: "You need to log in as a company first" };

  const parsed = addWorkerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const { name, password, category } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "An account with that email or phone already exists" };
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      error: "Worker accounts aren’t configured yet — SUPABASE_SERVICE_ROLE_KEY is missing.",
    };
  }

  // Unlike self-signup, the company is choosing this password on the
  // worker's behalf, so the account is created (and confirmed) directly
  // instead of going through Supabase's email-confirmation signup flow.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, account_role: "PROVIDER", phone, category },
  });
  if (error || !data.user) {
    return { ok: false, error: adminCreateErrorMessage(error?.code) };
  }

  try {
    await prisma.user.create({
      data: {
        id: data.user.id,
        name,
        email,
        phone,
        emailVerified: new Date(),
        role: "PROVIDER",
        provider: {
          create: {
            companyId: company.id,
            categories: [category],
            // A company vouches for workers it adds itself, so they skip
            // the platform review queue independent providers go through.
            approvalStatus: "APPROVED",
          },
        },
      },
    });
  } catch (profileError) {
    // Don't leave a working Supabase login with no matching app profile —
    // this is the one signup path that actually can clean up after itself,
    // since it holds the service-role key.
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    console.error("Company worker created in Supabase but profile creation failed", profileError);
    return { ok: false, error: "Couldn’t save the worker’s profile. Try again." };
  }

  revalidatePath("/company/dashboard");
  return { ok: true };
}

export async function removeCompanyWorker(providerId: string): Promise<ActionResult> {
  const company = await requireCompany();
  if (!company) return { ok: false, error: "You need to log in as a company first" };

  const provider = await prisma.provider.findFirst({
    where: { id: providerId, companyId: company.id },
    select: { id: true },
  });
  if (!provider) return { ok: false, error: "That worker could not be found" };

  await prisma.provider.update({
    where: { id: providerId },
    // Detach rather than delete: keeps job/review history intact and takes
    // them off the map immediately (isOnline: false) without touching their
    // Supabase login, which the company doesn't own.
    data: { companyId: null, approvalStatus: "SUSPENDED", isOnline: false },
  });

  revalidatePath("/company/dashboard");
  return { ok: true };
}

function adminCreateErrorMessage(code?: string) {
  if (code === "email_exists") return "An account with that email already exists";
  if (code === "weak_password") return "Choose a stronger password for this worker.";
  return "Couldn’t create the worker’s login. Check the email and password, then try again.";
}
