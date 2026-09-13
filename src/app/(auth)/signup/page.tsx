import { safeCustomerCallback } from "@/lib/auth-routing";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.callbackUrl;
  const callbackUrl = safeCustomerCallback(raw);

  return <SignupForm callbackUrl={callbackUrl} />;
}
