import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Worker login", robots: { index: false } };
export default async function WorkerLogin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const initialMessage = params.status === "password-updated" ? "Password updated. Log in with your new password." : null;
  return <LoginForm portal="PROVIDER" callbackUrl="/worker/dashboard" initialMessage={initialMessage} />;
}
