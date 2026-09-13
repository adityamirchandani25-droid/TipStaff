import { estimateAllServices } from "@/lib/pricing";
import type { Metadata } from "next";
import { listMyAddresses } from "@/lib/actions/requests";
import { RequestWizard } from "@/components/request-wizard/request-wizard";
import { CATEGORY_ORDER, URGENCY_ORDER, type ServiceCategory, type UrgencyLevel } from "@/lib/categories";

export const metadata: Metadata = { title: "New request", robots: { index: false } };

function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === "string" && (CATEGORY_ORDER as readonly string[]).includes(value);
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [addresses, params] = await Promise.all([listMyAddresses(), searchParams]);
  const q = params.q;
  const category = params.category;
  const urgency = typeof params.urgency === "string" && (URGENCY_ORDER as readonly string[]).includes(params.urgency) ? params.urgency as UrgencyLevel : undefined;

  return (
    <RequestWizard
      addresses={addresses}
      estimates={estimateAllServices()}
      initialDescription={typeof q === "string" ? q : undefined}
      initialCategory={isServiceCategory(category) ? category : undefined}
      initialUrgency={urgency}
    />
  );
}
