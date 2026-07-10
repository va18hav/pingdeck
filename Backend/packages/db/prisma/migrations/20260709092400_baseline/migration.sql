-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('RUNNING', 'DEAD', 'OFFLINE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "status" "WorkerStatus" NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);
