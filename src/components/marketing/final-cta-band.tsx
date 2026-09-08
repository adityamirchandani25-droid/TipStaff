import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCtaBand() {
  return (
    <section className="bg-brand-800 px-6 py-16 text-center sm:px-10">
      <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
        Something needs fixing?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-brand-100">
        Get matched with a vetted pro in minutes — no calling around, no
        guessing on price.
      </p>
      <Link href="/request/new" className="mt-7 inline-block">
        <Button size="lg" className="bg-white text-brand-800 hover:bg-brand-50">
          Describe the problem
        </Button>
      </Link>
    </section>
  );
}
