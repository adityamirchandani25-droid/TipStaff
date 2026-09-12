import type { listCompanyWorkers } from "@/lib/actions/company";

export type CompanyWorker = Awaited<ReturnType<typeof listCompanyWorkers>>[number];
