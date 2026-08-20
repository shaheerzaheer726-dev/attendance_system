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

-- Drop the problematic unique constraint from JobApplicationStepResponse
ALTER TABLE "JobApplicationStepResponse" DROP CONSTRAINT "JobApplicationStepResponse_interviewerId_scheduledAt_key";

-- Remove the interviewerId column from JobApplicationStepResponse
ALTER TABLE "JobApplicationStepResponse" DROP COLUMN "interviewerId";
