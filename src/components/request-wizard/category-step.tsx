import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_HINTS } from "@/lib/categories";
import type { ServiceCategory } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { RadioCard } from "@/components/ui/radio-card";

export function CategoryStep({
  value,
  onChange,
}: {
  value: ServiceCategory | null;
  onChange: (value: ServiceCategory) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight text-ink-900">What&apos;s wrong?</h2>
      <p className="mt-1.5 text-sm text-ink-500">Pick the closest match — we&apos;ll narrow it down next.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_ORDER.map((category) => (
          <RadioCard
            key={category}
            name="category"
            value={category}
            checked={value === category}
            onChange={(v) => onChange(v as ServiceCategory)}
            icon={<CategoryIcon category={category} className="h-5 w-5 text-brand-700" />}
            title={CATEGORY_LABELS[category]}
            description={CATEGORY_HINTS[category]}
          />
        ))}
      </div>
    </div>
  );
}
