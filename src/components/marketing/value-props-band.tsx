import { ShieldCheck, Timer, BadgeCheck, MapPin } from "lucide-react";

const VALUE_PROPS = [
  { icon: ShieldCheck, text: "Licensed & background-checked" },
  { icon: Timer, text: "Fast response, day or night" },
  { icon: BadgeCheck, text: "Upfront pricing, no surprises" },
  { icon: MapPin, text: "Live tracking to your door" },
];

export function ValuePropsBand() {
  return (
    <section className="bg-brand-800 px-6 py-14 sm:px-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {VALUE_PROPS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-50">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="text-sm font-medium text-brand-50">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
