import { cn } from "@/lib/utils";

export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2" role="list" aria-label="Request progress">
      {steps.map((step, i) => (
        <div key={step} role="listitem" aria-current={i === current ? "step" : undefined} aria-label={`${step}${i < current ? ": completed" : i === current ? ": current step" : ""}`} className="flex flex-1 items-center gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= current ? "bg-brand-600" : "bg-ink-200",
              )}
            />
            <span
              className={cn(
                "hidden text-[11px] font-medium uppercase tracking-wide sm:block",
                i === current ? "text-brand-700" : "text-ink-400",
              )}
            >
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
