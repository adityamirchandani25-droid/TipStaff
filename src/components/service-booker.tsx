"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleHelp, ReceiptText, LockKeyhole } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_HINTS, type ServiceCategory, type UrgencyLevel } from "@/lib/categories";
import type { ServiceEstimates } from "@/lib/pricing";

const timingOptions: { value: UrgencyLevel; label: string; hint: string }[] = [
  { value: "THIS_WEEK", label: "This week", hint: "I can be flexible" },
  { value: "TODAY", label: "Today", hint: "Sooner is better" },
  { value: "EMERGENCY", label: "As soon as possible", hint: "Priority request" },
];

export function ServiceBooker({ estimates, signedIn }: { estimates: ServiceEstimates; signedIn: boolean }) {
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>("THIS_WEEK");
  const estimate = category ? estimates[category][urgency] : null;
  const requestUrl = category ? `/request/new?category=${category}&urgency=${urgency}` : "";
  return <div className="booker-layout">
    <div className="service-browser">
      <div className="section-label"><span>Choose a service</span><span>1 of 2</span></div>
      <div className="service-options" role="group" aria-label="Choose a service">
        {CATEGORY_ORDER.map((item, i) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className="service-option" style={{ "--i": i } as CSSProperties}>
          <span className="service-option-top"><CategoryIcon category={item} className="h-7 w-7" /><span className="service-option-check" aria-hidden="true">{category === item && <Check size={12} strokeWidth={3} />}</span></span>
          <strong>{CATEGORY_LABELS[item]}</strong><span>{CATEGORY_HINTS[item]}</span>
        </button>)}
      </div>
      <div className="timing-selector"><div className="section-label"><span>When do you need help?</span><span>2 of 2</span></div><div className="timing-options" role="group" aria-label="Preferred timing">{timingOptions.map((item, i) => <button type="button" key={item.value} aria-pressed={urgency === item.value} onClick={() => setUrgency(item.value)} style={{ "--i": i } as CSSProperties}><span className="timing-radio" aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}</div><p>Timing is a preference. A worker and arrival time still need to be confirmed.</p></div>
    </div>
    <aside className="booking-summary" aria-label="Request estimate">
      <div className="summary-heading"><ReceiptText size={21} /><h2>Your request</h2></div>
      <div className="estimate-content" aria-live="polite" aria-atomic="true">
        {category && estimate ? <div className="estimate-selected" key={`${category}-${urgency}`}><span className="estimate-service">{CATEGORY_LABELS[category]}<span>{timingOptions.find(item => item.value === urgency)?.label}</span></span><p className="estimate-caption">Estimated callout + first hour</p><strong className="estimate-total">${estimate.low}<span>–</span>${estimate.high}</strong><span className="estimate-currency">USD · estimate, not a final quote</span></div> : <div className="estimate-empty"><span className="estimate-placeholder">$—</span><h3>Let’s start with the service.</h3><p>Choose what you need on the left. Your starting estimate will appear here.</p></div>}
      </div>
      <div className="estimate-breakdown"><span><Check size={15} /> Callout and first hour included</span><span><CircleHelp size={15} /> Parts and extra time are additional</span>{estimate && estimate.surgeMultiplier > 1 && <span className="priority-pricing">{estimate.surgeMultiplier}× timing / after-hours rate included</span>}</div>
      {category ? <Link href={requestUrl} className="booking-continue">Continue with {CATEGORY_LABELS[category].toLowerCase()}<ArrowRight size={18} /></Link> : <button className="booking-continue" disabled>Select a service to continue<ArrowRight size={18} /></button>}
      <p className="next-step">{signedIn ? "Next: describe the job and add an address." : "Next: sign in to save your request, then add job details."}</p>
      <div className="payment-note"><LockKeyhole size={15} /><span>No payment is collected with your request.</span></div>
    </aside>
    {category && estimate && <div className="mobile-booking-bar"><div><strong>{CATEGORY_LABELS[category]}</strong><span>${estimate.low}–${estimate.high} estimate</span></div><Link href={requestUrl}>Continue <ArrowRight size={17} /></Link></div>}
  </div>;
}

export function BookingQuestions() {
  return <div className="booking-questions"><h2>Know what to expect</h2><div>{[
    ["What does the estimate cover?", "The callout and first hour of work. Parts, extra time, and the actual scope can change the final cost. Priority and after-hours requests can cost more."],
    ["Am I booking a confirmed appointment?", "You’re submitting a service request. A worker still needs to be assigned, and your requested timing is not a confirmed arrival time."],
    ["What happens after I submit?", "Your request appears in My requests, with its saved details and current status. You can return to it whenever you sign in."],
  ].map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></div>;
}
