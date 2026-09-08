import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius-md)] border bg-surface-raised px-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
        invalid ? "border-red-400" : "border-border",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
