"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function HeroSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
    router.push(`/request/new${query}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-1 rounded-lg border border-border bg-surface-raised p-1.5 pl-5 shadow-[var(--shadow-raised)] transition-shadow focus-within:ring-2 focus-within:ring-brand-500/30"
    >
      <Search className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
      <input
        aria-label="Describe what needs fixing"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs fixing?"
        className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
      />
      <button
        aria-label="Get help with your repair"
        type="submit"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 active:scale-[0.97]"
      >
        <span className="hidden sm:inline">Find help</span>
        <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </form>
  );
}
