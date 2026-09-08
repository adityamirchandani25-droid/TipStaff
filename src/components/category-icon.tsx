import {
  Droplets,
  Zap,
  Thermometer,
  CloudRain,
  KeyRound,
  Refrigerator,
  Hammer,
  Bug,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ServiceCategory } from "@/lib/categories";

export const CATEGORY_ICONS: Record<ServiceCategory, LucideIcon> = {
  PLUMBING: Droplets,
  ELECTRICAL: Zap,
  HVAC: Thermometer,
  ROOFING: CloudRain,
  LOCKSMITH: KeyRound,
  APPLIANCE: Refrigerator,
  HANDYMAN: Hammer,
  PEST: Bug,
  OTHER: HelpCircle,
};

export function CategoryIcon({
  category,
  className,
  strokeWidth = 1.75,
}: {
  category: ServiceCategory;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
