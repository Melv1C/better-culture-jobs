-- CreateTable
CREATE TABLE "job_sync_state" (
    "source" "JobSource" NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_sync_state_pkey" PRIMARY KEY ("source")
);
