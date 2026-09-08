import { MessageCircle, Camera, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Navigation, text: "See your pro's live location and ETA the moment they're matched" },
  { icon: MessageCircle, text: "Message or call right from the app — no swapping phone numbers" },
  { icon: Camera, text: "Before-and-after photos land in your job history automatically" },
];

export function LiveTrackingShowcase() {
  return (
    <section className="px-6 py-20 sm:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl tracking-tight text-ink-900">
            Know exactly who&apos;s coming, and when.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            No more waiting around wondering if anyone&apos;s on the way.
            Once you&apos;re matched, you get the same visibility you&apos;d
            expect from a delivery order.
          </p>
          <ul className="mt-6 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm leading-relaxed text-ink-700">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-sm py-6">
          {/* Schematic route backdrop — stands in for a live map without a Mapbox token. */}
          <div className="absolute inset-0 -translate-y-2 translate-x-3 overflow-hidden rounded-[var(--radius-lg)] border border-brand-100 bg-brand-50">
            <svg viewBox="0 0 300 220" className="h-full w-full opacity-60" aria-hidden="true">
              <path
                d="M 20 190 Q 100 150 130 100 T 260 30"
                fill="none"
                stroke="var(--color-brand-300)"
                strokeWidth="3"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
              <circle cx="20" cy="190" r="7" fill="var(--color-brand-600)" />
              <circle cx="260" cy="30" r="7" fill="var(--color-emergency)" />
            </svg>
          </div>

          <Card className="relative">
            <CardContent className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                MR
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">Mike R. is 8 minutes away</p>
                <p className="text-xs text-ink-500">
                  Licensed plumber &middot; 4.9 rating &middot; En route
                </p>
              </div>
              <UrgencyBadge urgency="EMERGENCY" />
            </CardContent>
          </Card>

          <Card className="relative mt-3 max-w-[85%] translate-x-6">
            <CardContent className="flex items-center gap-3 py-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
              <p className="text-xs font-medium text-ink-700">
                Job started &middot; timer running
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
