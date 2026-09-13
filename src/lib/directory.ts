import type { ServiceCategory } from "@/lib/categories";

/** Public provider data returned by the live nearby-provider endpoint. */
export interface DirectoryListing {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string | null;
  categories: ServiceCategory[];
  bio: string | null;
  lat: number;
  lng: number;
  distanceMi: number;
  rating: number;
  ratingCount: number;
  jobsCompleted: number;
}

export function filterDirectoryListings(
  listings: DirectoryListing[],
  category: ServiceCategory | "ALL",
  query = "",
) {
  const search = query.trim().toLowerCase();
  return listings.filter((listing) => {
    const supportsCategory = category === "ALL" || listing.categories.includes(category);
    const searchText = `${listing.name} ${listing.companyName ?? ""} ${listing.categories.join(" ")} ${listing.bio ?? ""}`.toLowerCase();
    return supportsCategory && (!search || searchText.includes(search));
  });
}
