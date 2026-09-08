import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Plus, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { listMyRequests } from "@/lib/actions/requests";
import { CATEGORY_LABELS } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { UrgencyBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const requests = await listMyRequests();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="font-display text-2xl tracking-tight text-ink-900">Your requests</h1>
      <p className="mt-1 text-sm text-ink-500">Hi {firstName}. View your requests and their current status.</p>

      <Card className="mt-6 overflow-hidden border-brand-200 bg-brand-50">
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-white">
              <Plus className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Need help with something?</p>
              <p className="text-sm text-ink-600">Choose a service and see a starting estimate before you send.</p>
            </div>
          </div>
          <Link href="/request/new">
            <Button size="md">
              New request
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="mt-10">
        <h2 className="text-base font-semibold text-ink-900">
          Request history
        </h2>

        {requests.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="py-10 text-center">
              <ClipboardList size={30} className="mx-auto mb-4 text-ink-400" />
              <h3 className="text-base font-semibold">No requests yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">Once you send a request, you’ll see its details, estimate, and assignment status here.</p>
              <Link href="/services" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Browse services <ArrowRight size={15} /></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {requests.map((request) => (
              <Link key={request.id} href={`/request/${request.id}`}>
                <Card className="transition-shadow hover:shadow-[var(--shadow-raised)]">
                  <CardContent className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                      <CategoryIcon category={request.category} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {CATEGORY_LABELS[request.category]}
                        </p>
                        <UrgencyBadge urgency={request.urgency} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {request.address.line1} &middot;{" "}
                        {format(request.createdAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <RequestStatusBadge status={request.status} />
                      <span className="text-xs text-ink-500">
                        ${Number(request.priceEstimateLow)}&ndash;${Number(request.priceEstimateHigh)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
