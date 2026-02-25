-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('CULTURE_BE');

-- CreateEnum
CREATE TYPE "JobPostingType" AS ENUM ('EMPLOI', 'STAGE', 'BENEVOLAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDD', 'CDI', 'AUTRE');

-- CreateTable
CREATE TABLE "job" (
    "id" SERIAL NOT NULL,
    "uid" INTEGER NOT NULL,
    "source" "JobSource" NOT NULL DEFAULT 'CULTURE_BE',
    "sourceUrl" TEXT NOT NULL,
    "listingUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "publicationDateRaw" TEXT NOT NULL,
    "postingType" "JobPostingType" NOT NULL,
    "contractTypes" "ContractType"[] DEFAULT ARRAY[]::"ContractType"[],
    "contractLabel" TEXT,
    "location" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "applicationDeadlineRaw" TEXT,
    "jobDescription" TEXT,
    "requirements" TEXT,
    "contractDetails" TEXT,
    "regime" TEXT,
    "applicationInstructions" TEXT,
    "documentsRequired" TEXT,
    "comments" TEXT,
    "employerDescription" TEXT,
    "employerSectors" TEXT,
    "contactDetails" TEXT,
    "moreInfo" TEXT,
    "rawDetails" JSONB,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_source_uid_key" ON "job"("source", "uid");

-- CreateIndex
CREATE INDEX "job_source_publicationDate_idx" ON "job"("source", "publicationDate");

-- CreateIndex
CREATE INDEX "job_postingType_idx" ON "job"("postingType");

-- CreateIndex
CREATE INDEX "job_applicationDeadline_idx" ON "job"("applicationDeadline");
