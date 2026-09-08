import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench, BriefcaseBusiness, ClipboardCheck, Clock3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CATEGORY_LABELS } from "@/lib/categories";

export const metadata = { title: "Worker dashboard — TipStaff" };
export default async function WorkerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/worker/login");
  if (session.user.role !== "PROVIDER") redirect("/dashboard");
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    include: { jobs: { include: { request: { select: { category: true, description: true } } }, orderBy: { createdAt: "desc" }, take: 20 } },
  });
  const status = provider?.approvalStatus ?? "PENDING";
  return <div className="ts-worker-page"><header className="ts-header"><Link href="/" className="ts-logo"><BrandLogo /></Link><span className="ts-worker-label">Worker / driver</span><div className="ts-account"><SignOutButton /></div></header><main className="ts-section"><span className="ts-kicker">YOUR WORKSPACE</span><h1>Hey, {session.user.name?.split(" ")[0] || "there"}.</h1><p className="ts-worker-subtitle">Your jobs and account, all in one place.</p><div className="ts-worker-stats"><article><ClipboardCheck /><span>Account status</span><strong>{status.toLowerCase()}</strong></article><article><BriefcaseBusiness /><span>Completed jobs</span><strong>{provider?.jobsCompleted ?? 0}</strong></article><article><Wrench /><span>Your services</span><strong>{provider?.categories.map(c => CATEGORY_LABELS[c]).join(", ") || "Not set"}</strong></article></div>{status !== "APPROVED" && <div className="ts-worker-notice"><Clock3 size={22} /><div><h2>{status === "PENDING" ? "Your account is awaiting review" : "Your account isn’t active"}</h2><p>{status === "PENDING" ? "You’re registered. Your profile needs approval before you can receive new work." : "Your current account status does not allow new work."}</p></div></div>}<section className="ts-worker-jobs"><h2>Your jobs</h2>{provider?.jobs.length ? provider.jobs.map(job => <article key={job.id}><div><strong>{CATEGORY_LABELS[job.request.category]}</strong><p>{job.request.description}</p></div><span>{job.status.replaceAll("_", " ").toLowerCase()}</span></article>) : <div className="ts-worker-empty"><BriefcaseBusiness size={34} /><h3>No jobs yet</h3><p>Jobs assigned to you will appear here.</p></div>}</section></main></div>;
}
