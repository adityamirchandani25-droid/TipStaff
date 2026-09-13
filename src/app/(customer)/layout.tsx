import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { accountHome } from "@/lib/auth-routing";

export const metadata: Metadata = { robots: { index: false } };

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect(accountHome(session.user.role));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface-raised">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-ink-900"
          >
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100"
            >
              My requests
            </Link>
            <Link href="/request/new" className="ml-1">
              <Button size="sm">New request</Button>
            </Link>
            <div className="ml-3 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-sm text-ink-600 sm:block">{session.user.name}</span>
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col bg-surface">{children}</main>
    </div>
  );
}
