"use client";

import { usePathname } from "next/navigation";
import { Check, ClipboardList, Wrench, Building2, ShieldCheck } from "lucide-react";

const GUIDE_COPY = {
  recovery: {
    icon: ShieldCheck,
    overline: "SECURE ACCOUNT RECOVERY",
    heading: "Get back in safely.",
    intro: "FixItFast uses a private, time-limited recovery link to protect your account.",
    points: ["One-time recovery link", "No password sent by email", "Confirmation before the password changes"],
    note: "Only use a reset link you requested. FixItFast will never ask you to email us your password.",
  },
  company: {
    icon: Building2,
    overline: "COMPANY ACCOUNT",
    heading: "Manage your crew, in one place.",
    intro: "Add your workers and keep an eye on who's live on the map.",
    points: ["Add workers with their own login", "See who's currently online", "Remove a worker at any time"],
    note: "Workers you add are approved automatically — you're vouching for them.",
  },
  worker: {
    icon: Wrench,
    overline: "WORKER ACCOUNT",
    heading: "Your work, in one place.",
    intro: "Sign in to view your assigned jobs and account status.",
    points: ["View your worker profile", "Check your approval status", "See jobs assigned to you"],
    note: "New worker accounts need approval before they can receive work.",
  },
  customer: {
    icon: ClipboardList,
    overline: "CUSTOMER ACCOUNT",
    heading: "Keep track of every request.",
    intro: "Your account keeps your service details and request history together.",
    points: ["Save your service request", "Review the estimate before sending", "Return to your job details anytime"],
    note: "Signing in won’t book an appointment or collect a payment.",
  },
} as const;

export function AuthGuide() {
  const pathname = usePathname();
  const portal = pathname === "/forgot-password" || pathname === "/update-password" ? "recovery" : pathname.startsWith("/company") ? "company" : pathname.startsWith("/worker") ? "worker" : "customer";
  const copy = GUIDE_COPY[portal];
  const Icon = copy.icon;
  return (
    <aside className="ts-auth-story">
      <span className="auth-guide-icon"><Icon size={25} /></span>
      <span className="product-overline">{copy.overline}</span>
      <h2>{copy.heading}</h2>
      <p>{copy.intro}</p>
      <ul>{copy.points.map((text) => <li key={text}><Check size={16} />{text}</li>)}</ul>
      <div className="auth-guide-note">{copy.note}</div>
    </aside>
  );
}
