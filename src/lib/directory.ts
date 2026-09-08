import type { ServiceCategory } from "@/lib/categories";

export interface DirectoryCompany {
  id: string;
  name: string;
  initials: string;
  color: string;
  categories: ServiceCategory[];
  neighborhood: string;
  description: string;
  specialties: string[];
  lat: number;
  lng: number;
  worker: string;
}

/** Fictional listings for the directory preview; these are not live businesses. */
export const DEMO_COMPANIES: DirectoryCompany[] = [
  { id: "clearline", name: "Clearline Home Services", initials: "CL", color: "#1763d7", categories: ["PLUMBING", "HVAC", "APPLIANCE"], neighborhood: "Downtown Austin", description: "A full-service team for plumbing, heating, cooling, and everyday appliance repairs. Choose the job you need and review a starting estimate before requesting a visit.", specialties: ["Leak diagnosis", "Heating & cooling", "Appliance repairs"], lat: 30.268, lng: -97.746, worker: "Alex" },
  { id: "switch", name: "Switch Electrical", initials: "SW", color: "#7850c8", categories: ["ELECTRICAL", "APPLIANCE"], neighborhood: "East Austin", description: "Electrical troubleshooting and repairs for outlets, fixtures, breakers, and appliances. Describe the issue so the team knows what to prepare for.", specialties: ["Outlets & switches", "Lighting", "Breaker troubleshooting"], lat: 30.271, lng: -97.719, worker: "Jamie" },
  { id: "goodneighbor", name: "Good Neighbor Repairs", initials: "GN", color: "#23796a", categories: ["HANDYMAN", "ROOFING", "OTHER"], neighborhood: "Hyde Park", description: "Help with the smaller jobs that add up: mounting, assembly, repairs, gutters, and general home maintenance.", specialties: ["Furniture assembly", "Mounting & installation", "General repairs"], lat: 30.302, lng: -97.727, worker: "Taylor" },
  { id: "flow", name: "Flow Plumbing Co.", initials: "FP", color: "#1682b1", categories: ["PLUMBING", "HVAC"], neighborhood: "South Lamar", description: "Plumbing and climate-control help for leaks, clogged drains, water heaters, and AC problems. Request a visit for today or a more flexible time.", specialties: ["Drain clearing", "Water heaters", "AC servicing"], lat: 30.245, lng: -97.765, worker: "Morgan" },
  { id: "keyside", name: "Keyside Lock & Home", initials: "KH", color: "#b36b24", categories: ["LOCKSMITH", "HANDYMAN"], neighborhood: "Clarksville", description: "Lockouts, replacement locks, rekeying, and practical home repairs. Add a description of your lock or door when you request service.", specialties: ["Lockouts", "Rekeying", "Door hardware"], lat: 30.287, lng: -97.757, worker: "Sam" },
  { id: "homeguard", name: "Homeguard Services", initials: "HG", color: "#546d38", categories: ["PEST", "ROOFING", "OTHER"], neighborhood: "Riverside", description: "Support for home exteriors and pest issues, including gutters, minor roof repairs, and common household pests.", specialties: ["Pest assessment", "Gutters", "Exterior maintenance"], lat: 30.24, lng: -97.725, worker: "Jordan" },
];

export function findDirectoryCompany(id: string) {
  return DEMO_COMPANIES.find(company => company.id === id);
}

export function filterCompanies(category: ServiceCategory | "ALL", query = "") {
  const search = query.trim().toLowerCase();
  return DEMO_COMPANIES.filter(company => (category === "ALL" || company.categories.includes(category)) && (!search || `${company.name} ${company.neighborhood} ${company.specialties.join(" ")}`.toLowerCase().includes(search)));
}
