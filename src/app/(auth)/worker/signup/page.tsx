import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
export const metadata: Metadata = { title: "Join as a worker — FixItFast" };
export default function WorkerSignup() {
  return <SignupForm portal="PROVIDER" callbackUrl="/worker/dashboard" />;
}
