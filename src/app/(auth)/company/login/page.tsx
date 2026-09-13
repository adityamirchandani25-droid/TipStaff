import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Company login", robots: { index: false } };
export default async function CompanyLogin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const initialMessage = params.status === "password-updated" ? "Password updated. Log in with your new password." : null;
  return <LoginForm portal="COMPANY" callbackUrl="/company/dashboard" initialMessage={initialMessage} />;
}
