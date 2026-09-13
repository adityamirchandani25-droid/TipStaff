"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Something went wrong</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-ink-900">That didn’t load correctly.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">Your information is still safe. Try the page again, or return home and start fresh.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={retry}>Try again</Button>
          <Link href="/"><Button variant="secondary">Go home</Button></Link>
        </div>
        {error.digest && <p className="mt-5 text-xs text-ink-400">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
