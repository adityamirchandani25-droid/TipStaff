import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <span className="font-display text-base font-semibold tracking-tight text-ink-900">
            <BrandLogo />
          </span>
          <p className="mt-0.5 text-xs text-ink-500">
            Urgent home help, matched and tracked like a delivery order.
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm text-ink-600">
          <Link href="/login" className="hover:text-ink-900">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-ink-900">
            Sign up
          </Link>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-ink-400 sm:text-left">
        &copy; {new Date().getFullYear()} FixItFast
      </p>
    </footer>
  );
}
