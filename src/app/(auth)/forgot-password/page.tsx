import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { AccountPortal } from "@/lib/auth-routing";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const portal = parsePortal(params.portal);
  const initialError = params.error === "expired" ? "That reset link is invalid or expired. Request a new one below." : null;
  return <ForgotPasswordForm portal={portal} initialError={initialError} />;
}

function parsePortal(value: string | string[] | undefined): AccountPortal {
  return value === "PROVIDER" || value === "COMPANY" ? value : "CUSTOMER";
}
