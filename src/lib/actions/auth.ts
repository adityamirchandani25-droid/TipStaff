"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_ORDER } from "@/lib/categories";
import { accountHome, safeAuthCallback } from "@/lib/auth-routing";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";

export interface ActionResult {
  ok: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

export async function login(
  input: unknown,
  portal: "CUSTOMER" | "PROVIDER" = "CUSTOMER",
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again",
    };
  }

  try {
    const { identifier, password } = parsed.data;
    const phone = normalizePhone(identifier);
    let email = identifier.trim().toLowerCase();

    if (phone) {
      const profile = await prisma.user.findUnique({
        where: { phone },
        select: { email: true },
      });
      if (!profile) return invalidPortalLogin(portal);
      email = profile.email;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      if (error?.code === "email_not_confirmed") {
        return { ok: false, error: "Confirm your email before signing in." };
      }
      return invalidPortalLogin(portal);
    }

    const profile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { role: true },
    });
    if (!profile || profile.role !== portal) {
      await supabase.auth.signOut({ scope: "local" });
      return invalidPortalLogin(portal);
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Couldn’t connect to Supabase. Check the project URL and publishable key.",
    };
  }
}

export async function signUp(
  input: unknown,
  callbackUrl?: string,
): Promise<ActionResult> {
  return createAccount(input, "CUSTOMER", callbackUrl);
}

export async function signUpWorker(input: unknown): Promise<ActionResult> {
  return createAccount(input, "PROVIDER", "/worker/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

async function createAccount(
  input: unknown,
  role: "CUSTOMER" | "PROVIDER",
  callbackUrl?: string,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again",
    };
  }

  const { name, phone, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  const workerInput = z
    .object({ category: z.enum(CATEGORY_ORDER) })
    .safeParse(input);
  if (role === "PROVIDER" && !workerInput.success) {
    return { ok: false, error: "Choose the service you provide" };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
      select: { id: true },
    });
    if (existing) {
      return {
        ok: false,
        error: "An account with that email or phone already exists",
      };
    }

    const supabase = await createSupabaseServerClient();
    const requestHeaders = await headers();
    const origin = requestHeaders.get("origin");
    const next = safeAuthCallback(callbackUrl, accountHome(role));
    const emailRedirectTo = origin
      ? `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
      : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: normalizedPhone },
        emailRedirectTo,
      },
    });

    if (error) return { ok: false, error: signupErrorMessage(error.code) };
    if (!data.user || data.user.identities?.length === 0) {
      return {
        ok: false,
        error: "An account with that email already exists",
      };
    }

    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          name,
          email,
          phone: normalizedPhone,
          emailVerified: data.user.email_confirmed_at
            ? new Date(data.user.email_confirmed_at)
            : null,
          role,
          ...(role === "PROVIDER" && workerInput.success
            ? {
                provider: {
                  create: {
                    categories: [workerInput.data.category],
                    approvalStatus: "PENDING",
                  },
                },
              }
            : {}),
        },
      });
    } catch (profileError) {
      console.error(
        "Supabase user created but TipStaff profile creation failed",
        profileError,
      );
      if (data.session) await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        error:
          "Your login was created, but the TipStaff profile could not be saved. Contact support before trying again.",
      };
    }

    return { ok: true, requiresEmailConfirmation: !data.session };
  } catch {
    return {
      ok: false,
      error:
        "Couldn’t connect to Supabase. Check the project URL, publishable key, and database connection.",
    };
  }
}

function invalidPortalLogin(
  portal: "CUSTOMER" | "PROVIDER",
): ActionResult {
  return {
    ok: false,
    error: `Those details don’t match a ${portal === "PROVIDER" ? "worker" : "customer"} account. Check your login details or switch account type.`,
  };
}

function signupErrorMessage(code?: string) {
  if (code === "user_already_exists" || code === "email_exists") {
    return "An account with that email already exists";
  }
  if (code === "over_email_send_rate_limit") {
    return "Too many confirmation emails were requested. Wait a few minutes and try again.";
  }
  if (code === "weak_password") return "Choose a stronger password.";
  return "Supabase couldn’t create the account. Check the email and password, then try again.";
}
