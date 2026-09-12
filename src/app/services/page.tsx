import { CompanyDirectory } from "@/components/directory/company-directory";
import { SiteHeader } from "@/components/site-header";
import { CATEGORY_ORDER, type ServiceCategory } from "@/lib/categories";
import { estimateAllServices } from "@/lib/pricing";
import "leaflet/dist/leaflet.css";
import "../marketplace.css";
import "../marketplace.dark.css";

export const metadata = { title: "Find home services — FixItFast" };
export default async function ServicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" && (CATEGORY_ORDER as readonly string[]).includes(params.category) ? params.category as ServiceCategory : "ALL";
  return <div className="marketplace-page"><SiteHeader current="services" /><CompanyDirectory initialCategory={category} estimates={estimateAllServices()} /></div>;
}
