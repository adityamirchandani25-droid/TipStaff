"use client";

import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";

export function PriceEstimateCard({
  low,
  high,
  surgeMultiplier,
}: {
  low: number;
  high: number;
  surgeMultiplier: number;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-brand-200 bg-brand-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Estimated price
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${low}-${high}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="font-display text-3xl tracking-tight text-ink-900"
          >
            ${low}&ndash;${high}
          </motion.span>
        </AnimatePresence>
        {surgeMultiplier > 1 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-brand-700">
            {surgeMultiplier}&times; demand pricing
          </span>
        )}
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        Covers the callout and first hour. Parts and extra time are quoted on
        site before any work starts.
      </p>
    </div>
  );
}
