import { ClipboardList, Users, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us what's wrong",
    description:
      "Pick a category, add a few details and a photo if you have one. Takes under a minute.",
  },
  {
    icon: Users,
    title: "Get matched instantly",
    description:
      "We rank nearby available pros by distance and rating, and dispatch to the best fit first.",
  },
  {
    icon: ShieldCheck,
    title: "Track, then pay with confidence",
    description:
      "Watch your pro's live ETA, chat if you need to, and pay only once the job is done.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-raised px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight text-ink-900">How it works</h2>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="font-display text-2xl text-ink-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
