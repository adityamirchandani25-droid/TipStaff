import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
export const metadata: Metadata = { title: "Register your company", robots: { index: false } };
export default function CompanySignup() {
  return <SignupForm portal="COMPANY" callbackUrl="/company/dashboard" />;
}
