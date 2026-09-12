import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthGuide } from "@/components/auth/auth-guide";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="ts-auth-page"><header><Link href="/" aria-label="FixItFast home"><BrandLogo /></Link><Link href="/services" className="ts-back"><ArrowLeft size={16} /> Back to services</Link></header><main className="ts-auth-main"><AuthGuide /><div className="ts-auth-panel">{children}</div></main><footer>© {new Date().getFullYear()} FixItFast</footer></div>;
}
