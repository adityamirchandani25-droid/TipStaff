"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_ORDER } from "@/lib/categories";
import { ensureAccountProfile } from "@/lib/auth";
import { accountHome, safeAuthCallback } from "@/lib/auth-routing";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";
import { getSiteUrl } from "@/lib/site-url";

export interface ActionResult {
  ok: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
  portal: z.enum(["CUSTOMER", "PROVIDER", "COMPANY"]).default("CUSTOMER"),
});

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don’t match",
    path: ["confirmPassword"],
  });

export async function login(
  input: unknown,
  portal: "CUSTOMER" | "PROVIDER" | "COMPANY" = "CUSTOMER",
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

    const profile = await ensureAccountProfile(data.user, portal);
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

export async function signUpCompany(input: unknown): Promise<ActionResult> {
  return createAccount(input, "COMPANY", "/company/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const requestHeaders = await headers();
    const requestOrigin = requestHeaders.get("origin");
    const origin = isHttpOrigin(requestOrigin) ? requestOrigin : getSiteUrl();
    const next = `/update-password?portal=${parsed.data.portal}`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email.trim().toLowerCase(),
      { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    );

    if (error?.code === "over_email_send_rate_limit") {
      return { ok: false, error: "Please wait a minute before requesting another reset email." };
    }
    if (error) {
      console.error("Supabase password reset request failed", { code: error.code });
      return { ok: false, error: "We couldn’t send the reset email. Try again shortly." };
    }
    // Always return the same result when an account is absent so this form
    // cannot be used to discover registered email addresses.
    return { ok: true };
  } catch (error) {
    console.error("Password reset email request failed", error);
    return { ok: false, error: "We couldn’t send the reset email. Try again shortly." };
  }
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your new password" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims?.sub) {
      return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return {
        ok: false,
        error:
          error.code === "same_password"
            ? "Choose a password you haven’t used before."
            : "We couldn’t update your password. Request a new reset link and try again.",
      };
    }
    await supabase.auth.signOut({ scope: "local" });
    return { ok: true };
  } catch (error) {
    console.error("Password update failed", error);
    return { ok: false, error: "We couldn’t update your password. Try again shortly." };
  }
}

async function createAccount(
  input: unknown,
  role: "CUSTOMER" | "PROVIDER" | "COMPANY",
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
        data: {
          full_name: name,
          phone: normalizedPhone,
          account_role: role,
          ...(role === "PROVIDER" && workerInput.success
            ? { category: workerInput.data.category }
            : {}),
        },
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
      await ensureAccountProfile(data.user, role);
    } catch (profileError) {
      console.error(
        "Supabase user created but FixItFast profile creation failed",
        profileError,
      );
      if (data.session) await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        error:
          "Your login was created, but the FixItFast profile could not be saved. Contact support before trying again.",
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
  portal: "CUSTOMER" | "PROVIDER" | "COMPANY",
): ActionResult {
  const portalLabel =
    portal === "PROVIDER" ? "worker" : portal === "COMPANY" ? "company" : "customer";
  return {
    ok: false,
    error: `Those details don’t match a ${portalLabel} account. Check your login details or switch account type.`,
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

function isHttpOrigin(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === value && (url.protocol === "https:" || url.hostname === "localhost");
  } catch {
    return false;
  }
}
