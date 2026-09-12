import Link from "next/link";
import { House, Wrench, Building2 } from "lucide-react";
import type { AccountPortal } from "@/lib/auth-routing";

export function AccountSwitch({ portal, signup = false }: { portal: AccountPortal; signup?: boolean }) {
  const route = signup ? "signup" : "login";
  return <nav className="ts-account-switch" aria-label="Account type">
    <Link href={`/${route}`} aria-current={portal === "CUSTOMER" ? "page" : undefined}><House size={17} /> Customer</Link>
    <Link href={`/worker/${route}`} aria-current={portal === "PROVIDER" ? "page" : undefined}><Wrench size={17} /> Worker / driver</Link>
    <Link href={`/company/${route}`} aria-current={portal === "COMPANY" ? "page" : undefined}><Building2 size={17} /> Company</Link>
  </nav>;
}
