import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Clock, MapPin } from "lucide-react";
import { getMyRequest } from "@/lib/actions/requests";
import { CATEGORY_LABELS } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { UrgencyBadge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getMyRequest(id);
  if (!request) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-brand-200 bg-brand-50 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{request.status === "CANCELLED" ? "Request cancelled" : request.status === "MATCHED" ? "Worker assigned" : request.status === "UNMATCHED" ? "No worker assigned" : "Your request is saved"}</p>
          <p className="text-sm text-ink-600">
            {request.status === "SEARCHING" ? "No worker has been assigned yet. Your requested timing is not a confirmed appointment." : request.status === "MATCHED" ? "A worker has been assigned to your request." : request.status === "CANCELLED" ? "This request is no longer active." : "This request has not been matched with a worker."}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                <CategoryIcon category={request.category} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {CATEGORY_LABELS[request.category]}
                </p>
                <p className="text-xs text-ink-500">
                  Requested {format(request.createdAt, "MMM d 'at' h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <RequestStatusBadge status={request.status} />
              <UrgencyBadge urgency={request.urgency} />
            </div>
          </div>

          <p className="border-t border-border pt-4 text-sm leading-relaxed text-ink-700">
            {request.description}
          </p>

          {request.photos.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {request.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={photo}
                  alt=""
                  className="h-20 w-20 rounded-[var(--radius-md)] border border-border object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} />
            <p className="text-sm text-ink-700">
              {request.address.line1}
              {request.address.line2 ? `, ${request.address.line2}` : ""},{" "}
              {request.address.city}, {request.address.state} {request.address.postalCode}
            </p>
          </div>

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.75} />
            <div className="text-sm text-ink-700">
              <span className="font-medium text-ink-900">
                ${Number(request.priceEstimateLow)}&ndash;${Number(request.priceEstimateHigh)}{" "}
                estimated
              </span>
              <span className="block text-xs text-ink-500">
                Covers the callout and first hour. Final price is confirmed on site.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link href="/dashboard" className="mt-6 block">
        <Button variant="secondary" className="w-full">
          Back to your requests
        </Button>
      </Link>
    </div>
  );
}
