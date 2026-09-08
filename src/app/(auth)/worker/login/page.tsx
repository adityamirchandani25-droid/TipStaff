import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Worker login — TipStaff" };
export default function WorkerLogin() {
  return <LoginForm portal="PROVIDER" callbackUrl="/worker/dashboard" />;
}
