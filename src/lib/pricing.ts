import { CATEGORY_ORDER, URGENCY_ORDER, type ServiceCategory, type UrgencyLevel } from "@/lib/categories";

/** Callout fee + first-hour range, in whole dollars, before surge. */
export const CATEGORY_PRICING: Record<
  ServiceCategory,
  { calloutFee: number; hourlyLow: number; hourlyHigh: number }
> = {
  PLUMBING: { calloutFee: 89, hourlyLow: 75, hourlyHigh: 150 },
  ELECTRICAL: { calloutFee: 99, hourlyLow: 80, hourlyHigh: 160 },
  HVAC: { calloutFee: 109, hourlyLow: 90, hourlyHigh: 180 },
  ROOFING: { calloutFee: 129, hourlyLow: 85, hourlyHigh: 170 },
  LOCKSMITH: { calloutFee: 79, hourlyLow: 60, hourlyHigh: 120 },
  APPLIANCE: { calloutFee: 79, hourlyLow: 70, hourlyHigh: 140 },
  HANDYMAN: { calloutFee: 69, hourlyLow: 55, hourlyHigh: 110 },
  PEST: { calloutFee: 89, hourlyLow: 65, hourlyHigh: 130 },
  OTHER: { calloutFee: 79, hourlyLow: 65, hourlyHigh: 130 },
};

const URGENCY_MULTIPLIER: Record<UrgencyLevel, number> = {
  EMERGENCY: 1.5,
  TODAY: 1.15,
  THIS_WEEK: 1,
};

const AFTER_HOURS_MULTIPLIER = 1.2;

/** After-hours window is before 8am or after 8pm, local to the server. */
function isAfterHours(at: Date) {
  const hour = at.getHours();
  return hour < 8 || hour >= 20;
}

/**
 * Surge = urgency multiplier, stacked with an after-hours multiplier for
 * anything more time-sensitive than "this week" (a flexible booking
 * shouldn't be penalized for when it happens to be placed).
 */
export function computeSurgeMultiplier(urgency: UrgencyLevel, at: Date = new Date()) {
  let multiplier = URGENCY_MULTIPLIER[urgency];
  if (urgency !== "THIS_WEEK" && isAfterHours(at)) {
    multiplier *= AFTER_HOURS_MULTIPLIER;
  }
  return Math.round(multiplier * 100) / 100;
}

export interface PriceEstimate {
  low: number;
  high: number;
  surgeMultiplier: number;
}

export function estimatePriceRange(
  category: ServiceCategory,
  urgency: UrgencyLevel,
  at: Date = new Date(),
): PriceEstimate {
  const { calloutFee, hourlyLow, hourlyHigh } = CATEGORY_PRICING[category];
  const surgeMultiplier = computeSurgeMultiplier(urgency, at);
  return {
    low: Math.round((calloutFee + hourlyLow) * surgeMultiplier),
    high: Math.round((calloutFee + hourlyHigh) * surgeMultiplier),
    surgeMultiplier,
  };
}

export type ServiceEstimates = Record<ServiceCategory, Record<UrgencyLevel, PriceEstimate>>;

/** Calculate on the server once so previews use the same clock and timezone. */
export function estimateAllServices(at: Date = new Date()): ServiceEstimates {
  return Object.fromEntries(CATEGORY_ORDER.map(category => [category,
    Object.fromEntries(URGENCY_ORDER.map(urgency => [urgency, estimatePriceRange(category, urgency, at)])),
  ])) as ServiceEstimates;
}
