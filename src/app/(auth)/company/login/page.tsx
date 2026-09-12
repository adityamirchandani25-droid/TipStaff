import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Company login — FixItFast" };
export default function CompanyLogin() {
  return <LoginForm portal="COMPANY" callbackUrl="/company/dashboard" />;
}
