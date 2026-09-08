import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-md)] border bg-surface-raised px-3.5 py-3 text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
        invalid ? "border-red-400" : "border-border",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
