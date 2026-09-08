import { safeCustomerCallback } from "@/lib/auth-routing";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in — TipStaff" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.callbackUrl;
  const callbackUrl = safeCustomerCallback(raw);
  const initialError =
    params.error === "confirmation"
      ? "That confirmation link is invalid or expired. Request a new email from Supabase and try again."
      : null;

  return <LoginForm callbackUrl={callbackUrl} initialError={initialError} />;
}
