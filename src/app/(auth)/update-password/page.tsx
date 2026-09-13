import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import type { AccountPortal } from "@/lib/auth-routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/forgot-password?error=expired");
  return <UpdatePasswordForm portal={parsePortal(params.portal)} />;
}

function parsePortal(value: string | string[] | undefined): AccountPortal {
  return value === "PROVIDER" || value === "COMPANY" ? value : "CUSTOMER";
}
