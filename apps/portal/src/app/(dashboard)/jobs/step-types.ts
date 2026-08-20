// Shared types for job posting steps. Used by both server actions and client
// components — this file has no "use server"/"use client" directive so it can
// be imported from either side.

export type QuestionType = "TEXT" | "MULTIPLE_CHOICE";

export type JobStepQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  allowMultiple?: boolean; // only relevant when type === "MULTIPLE_CHOICE"
  options?: string[]; // only relevant when type === "MULTIPLE_CHOICE"
};

export type EmailCvStepConfig = {
  email: string;
  instructions?: string;
};

export type QuestionnaireStepConfig = {
  questions: JobStepQuestion[];
};

export type InterviewStepConfig = {
  interviewerIds: string[];
};

export const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri only, weekends are excluded from interview slots

export const INTERVIEW_SLOT_MINUTES = 30;

export function generateDaySlots(dailyStartTime: string, dailyEndTime: string): string[] {
  const slots: string[] = [];
  const [startHour = 0, startMinute = 0] = dailyStartTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = dailyEndTime.split(":").map(Number);

  let cursor = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  while (cursor + INTERVIEW_SLOT_MINUTES <= end) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    cursor += INTERVIEW_SLOT_MINUTES;
  }

  return slots;
}
