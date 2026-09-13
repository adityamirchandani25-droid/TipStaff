import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">404</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-ink-900">This page needs a different address.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">The link may be outdated, or the page may have moved.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/services"><Button>Find a service</Button></Link>
          <Link href="/"><Button variant="secondary">Go home</Button></Link>
        </div>
      </div>
    </main>
  );
}
