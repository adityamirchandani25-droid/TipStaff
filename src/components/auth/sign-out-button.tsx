"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
