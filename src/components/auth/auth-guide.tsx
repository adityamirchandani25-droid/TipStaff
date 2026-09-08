"use client";

import { usePathname } from "next/navigation";
import { Check, ClipboardList, Wrench } from "lucide-react";

export function AuthGuide() {
  const worker = usePathname().startsWith("/worker");
  return <aside className="ts-auth-story"><span className="auth-guide-icon">{worker ? <Wrench size={25} /> : <ClipboardList size={25} />}</span><span className="product-overline">{worker ? "WORKER ACCOUNT" : "CUSTOMER ACCOUNT"}</span><h2>{worker ? "Your work, in one place." : "Keep track of every request."}</h2><p>{worker ? "Sign in to view your assigned jobs and account status." : "Your account keeps your service details and request history together."}</p><ul>{(worker ? ["View your worker profile", "Check your approval status", "See jobs assigned to you"] : ["Save your service request", "Review the estimate before sending", "Return to your job details anytime"]).map(text => <li key={text}><Check size={16} />{text}</li>)}</ul><div className="auth-guide-note">{worker ? "New worker accounts need approval before they can receive work." : "Signing in won’t book an appointment or collect a payment."}</div></aside>;
}
