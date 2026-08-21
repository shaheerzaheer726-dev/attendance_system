-- Create InterviewerBooking table for multi-interviewer support
CREATE TABLE "InterviewerBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepResponseId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewerBooking_stepResponseId_fkey" FOREIGN KEY ("stepResponseId") REFERENCES "JobApplicationStepResponse" ("id") ON DELETE CASCADE,
    CONSTRAINT "InterviewerBooking_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "Employment" ("id") ON DELETE RESTRICT
);

-- Create unique index for interviewer + scheduledAt
CREATE UNIQUE INDEX "InterviewerBooking_interviewerId_scheduledAt_key" ON "InterviewerBooking"("interviewerId", "scheduledAt");

-- Create index for stepResponseId
CREATE INDEX "InterviewerBooking_stepResponseId_idx" ON "InterviewerBooking"("stepResponseId");

-- Create index for interviewerId + scheduledAt (for booking lookups)
CREATE INDEX "InterviewerBooking_interviewerId_scheduledAt_idx" ON "InterviewerBooking"("interviewerId", "scheduledAt");

-- Drop the problematic unique index from JobApplicationStepResponse
DROP INDEX "JobApplicationStepResponse_interviewerId_scheduledAt_key";

-- Backfill existing interviewer bookings before dropping the legacy columns
INSERT INTO "InterviewerBooking" ("id", "stepResponseId", "interviewerId", "scheduledAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "interviewerId", "scheduledAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "JobApplicationStepResponse"
WHERE "interviewerId" IS NOT NULL AND "scheduledAt" IS NOT NULL
ON CONFLICT ("interviewerId", "scheduledAt") DO NOTHING;

