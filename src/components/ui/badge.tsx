import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      tone: {
        emergency: "bg-emergency-bg text-emergency",
        today: "bg-today-bg text-today",
        scheduled: "bg-scheduled-bg text-scheduled",
        success: "bg-success-bg text-success",
        neutral: "bg-ink-100 text-ink-700",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const URGENCY_TONE = {
  EMERGENCY: "emergency",
  TODAY: "today",
  THIS_WEEK: "scheduled",
} as const;

const URGENCY_LABEL = {
  EMERGENCY: "Emergency",
  TODAY: "Today",
  THIS_WEEK: "This week",
} as const;

export function UrgencyBadge({
  urgency,
  className,
}: {
  urgency: keyof typeof URGENCY_TONE;
  className?: string;
}) {
  return (
    <Badge tone={URGENCY_TONE[urgency]} dot className={className}>
      {URGENCY_LABEL[urgency]}
    </Badge>
  );
}
