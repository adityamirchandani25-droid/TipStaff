import { Zap, Sun, CalendarDays } from "lucide-react";
import { URGENCY_ORDER, URGENCY_LABELS, URGENCY_DESCRIPTIONS } from "@/lib/categories";
import type { UrgencyLevel } from "@/lib/categories";
import type { PriceEstimate } from "@/lib/pricing";
import { RadioCard } from "@/components/ui/radio-card";
import { PriceEstimateCard } from "@/components/request-wizard/price-estimate-card";

const URGENCY_ICON = { EMERGENCY: Zap, TODAY: Sun, THIS_WEEK: CalendarDays } as const;
const URGENCY_TONE = { EMERGENCY: "emergency", TODAY: "today", THIS_WEEK: "scheduled" } as const;

export function UrgencyStep({
  estimates,
  value,
  onChange,
}: {
  estimates: Record<UrgencyLevel, PriceEstimate>;
  value: UrgencyLevel | null;
  onChange: (value: UrgencyLevel) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-tight text-ink-900">When do you need help?</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        Choose your preferred timing. Availability and arrival time still need to be confirmed.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {URGENCY_ORDER.map((urgency) => {
          const Icon = URGENCY_ICON[urgency];
          return (
            <RadioCard
              key={urgency}
              name="urgency"
              value={urgency}
              checked={value === urgency}
              onChange={(v) => onChange(v as UrgencyLevel)}
              tone={URGENCY_TONE[urgency]}
              icon={<Icon className="h-5 w-5 text-ink-700" strokeWidth={1.75} />}
              title={URGENCY_LABELS[urgency]}
              description={URGENCY_DESCRIPTIONS[urgency]}
            />
          );
        })}
      </div>

      {value && (
        <div className="mt-6">
          <PriceEstimateCard {...estimates[value]} />
        </div>
      )}
    </div>
  );
}
