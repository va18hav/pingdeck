-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastErrorAt" TIMESTAMP(3);
