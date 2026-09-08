import Link from "next/link";
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_HINTS } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";

export function CategoryGrid() {
  return (
    <section id="categories" className="scroll-mt-20 px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-lg">
          <h2 className="font-display text-3xl tracking-tight text-ink-900">
            Whatever it is, there&apos;s a pro for it
          </h2>
          <p className="mt-2 text-[15px] text-ink-600">
            Pick a category to jump straight into a request — you can always
            fine-tune the details next.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORY_ORDER.map((category) => (
            <Link
              key={category}
              href={`/request/new?category=${category}`}
              className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-raised p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-raised)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                <CategoryIcon category={category} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-900">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="block text-xs text-ink-500">{CATEGORY_HINTS[category]}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
