import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_RING = {
  neutral: "has-[:checked]:border-brand-600 has-[:checked]:ring-brand-500/15",
  emergency: "has-[:checked]:border-emergency has-[:checked]:ring-emergency/15",
  today: "has-[:checked]:border-today has-[:checked]:ring-today/15",
  scheduled: "has-[:checked]:border-scheduled has-[:checked]:ring-scheduled/15",
} as const;

const TONE_CHECK_BG = {
  neutral: "bg-brand-600",
  emergency: "bg-emergency",
  today: "bg-today",
  scheduled: "bg-scheduled",
} as const;

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  description,
  tone = "neutral",
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  tone?: keyof typeof TONE_RING;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-raised p-4 transition-all",
        "hover:border-ink-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500 has-[:focus-visible]:outline-offset-2",
        "has-[:checked]:ring-2",
        TONE_RING[tone],
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "absolute right-3 top-3 hidden h-5 w-5 items-center justify-center rounded-full text-white peer-checked:flex",
          TONE_CHECK_BG[tone],
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {icon}
      <span className="text-sm font-semibold text-ink-900">{title}</span>
      {description && <span className="text-xs leading-snug text-ink-500">{description}</span>}
    </label>
  );
}
