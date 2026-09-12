-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_jobId_fkey";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "requestId" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
