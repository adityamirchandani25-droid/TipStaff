export const CATEGORY_ORDER = [
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "LOCKSMITH",
  "APPLIANCE",
  "HANDYMAN",
  "ROOFING",
  "PEST",
  "OTHER",
] as const;

export type ServiceCategory = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
  ROOFING: "Roofing",
  LOCKSMITH: "Locksmith",
  APPLIANCE: "Appliance",
  HANDYMAN: "Handyman",
  PEST: "Pest control",
  OTHER: "Something else",
};

export const CATEGORY_HINTS: Record<ServiceCategory, string> = {
  PLUMBING: "Leaks, clogs, water heaters",
  ELECTRICAL: "Outlets, breakers, wiring",
  HVAC: "Heating, cooling, ventilation",
  ROOFING: "Leaks, storm damage, gutters",
  LOCKSMITH: "Lockouts, rekeying, broken locks",
  APPLIANCE: "Washer, fridge, oven repair",
  HANDYMAN: "General fixes, small jobs",
  PEST: "Ants, rodents, termites",
  OTHER: "Not sure? We'll figure it out",
};

export const URGENCY_ORDER = ["EMERGENCY", "TODAY", "THIS_WEEK"] as const;

export type UrgencyLevel = (typeof URGENCY_ORDER)[number];

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  EMERGENCY: "Emergency",
  TODAY: "Today",
  THIS_WEEK: "This week",
};

export const URGENCY_DESCRIPTIONS: Record<UrgencyLevel, string> = {
  EMERGENCY: "Send the next available pro right now",
  TODAY: "Get it handled before the day is out",
  THIS_WEEK: "Flexible — whenever a good pro is free",
};
