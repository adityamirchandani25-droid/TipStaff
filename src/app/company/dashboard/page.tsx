import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Users, UserCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCompanyWorkers } from "@/lib/actions/company";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AddWorkerForm } from "@/components/company/add-worker-form";
import { WorkerRoster } from "@/components/company/worker-roster";
import { accountHome } from "@/lib/auth-routing";

export const metadata = { title: "Company dashboard — FixItFast" };

export default async function CompanyDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/company/login");
  if (session.user.role !== "COMPANY") redirect(accountHome(session.user.role));

  const [company, workers] = await Promise.all([
    prisma.company.findUnique({ where: { userId: session.user.id } }),
    listCompanyWorkers(),
  ]);
  const onlineCount = workers.filter((worker) => worker.isOnline).length;

  return (
    <div className="ts-worker-page">
      <header className="ts-header">
        <Link href="/" className="ts-logo">
          <BrandLogo />
        </Link>
        <span className="ts-worker-label">Company</span>
        <div className="ts-account">
          <SignOutButton />
        </div>
      </header>
      <main className="ts-section">
        <span className="ts-kicker">YOUR COMPANY</span>
        <h1>{company?.name ?? session.user.name}</h1>
        <p className="ts-worker-subtitle">Add workers and see who’s currently sharing their location on the map.</p>

        <div className="ts-worker-stats">
          <article>
            <Users />
            <span>Total workers</span>
            <strong>{workers.length}</strong>
          </article>
          <article>
            <UserCheck />
            <span>Online now</span>
            <strong>{onlineCount}</strong>
          </article>
          <article>
            <Building2 />
            <span>Company status</span>
            <strong>active</strong>
          </article>
        </div>

        <section className="ts-worker-jobs">
          <h2>Add a worker</h2>
          <AddWorkerForm />
        </section>

        <section className="ts-worker-jobs">
          <h2>Your workers</h2>
          <WorkerRoster workers={workers} />
        </section>
      </main>
    </div>
  );
}
