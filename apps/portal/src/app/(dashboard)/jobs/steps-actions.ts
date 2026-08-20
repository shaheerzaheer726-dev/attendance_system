"use server";

import { getCurrentUser } from "../../../lib/session";
import { createPrismaClient } from "@attendance/db";
import { revalidatePath } from "next/cache";
import { isHr } from "./permissions";
import {
  generateDaySlots,
  type EmailCvStepConfig,
  type InterviewStepConfig,
  type QuestionnaireStepConfig,
  type JobStepQuestion
} from "./step-types";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export type StepFormState = { error?: string; success?: string };

function parseQuestionnaireQuestions(
  formData: FormData
): { questions: JobStepQuestion[] } | { error: string } {
  const questionsRaw = formData.get("questionsJson") as string;

  let questions: JobStepQuestion[];
  try {
    questions = JSON.parse(questionsRaw);
  } catch {
    return { error: "Could not read the questionnaire questions. Please try again." };
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: "Add at least one question to the questionnaire." };
  }

  for (const question of questions) {
    if (!question.prompt || !question.prompt.trim()) {
      return { error: "Every question needs a prompt." };
    }
    if (
      question.type === "MULTIPLE_CHOICE" &&
      (!question.options || question.options.filter((option) => option.trim()).length < 2)
    ) {
      return { error: `Question "${question.prompt}" needs at least two options.` };
    }
  }

  return { questions };
}

export async function addJobStep(
  prevState: StepFormState,
  formData: FormData
): Promise<StepFormState> {
  const user = await getCurrentUser();

  if (!isHr(user)) {
    return { error: "Unauthorized: Only HR can configure job steps." };
  }

  const jobPostingId = formData.get("jobPostingId") as string;
  const type = formData.get("type") as string;

  if (!jobPostingId) {
    return { error: "Missing job posting reference." };
  }

  const job = await db.jobPosting.findFirst({
    where: { id: jobPostingId, organizationId: user!.organizationId },
    select: { status: true }
  });
  if (!job) {
    return { error: "This job posting no longer exists." };
  }
  if (job.status !== "DRAFT") {
    return { error: "Published job postings cannot be changed." };
  }

  if (type === "EMAIL_CV") {
    const existingEmailStep = await db.jobPostingStep.findFirst({
      where: { jobPostingId, type: "EMAIL_CV" },
      select: { id: true }
    });

    if (existingEmailStep) {
      return { error: "Only one email CV step can be added to a job posting." };
    }
  }

  const lastStep = await db.jobPostingStep.findFirst({
    where: { jobPostingId },
    orderBy: { order: "desc" }
  });
  const nextOrder = (lastStep?.order ?? -1) + 1;

  if (type === "EMAIL_CV") {
    const email = (formData.get("email") as string)?.trim();
    const instructions = (formData.get("instructions") as string)?.trim();

    if (!email || !email.includes("@")) {
      return { error: "A valid email address is required for this step." };
    }

    const config: EmailCvStepConfig = { email, instructions: instructions || undefined };

    await db.jobPostingStep.create({
      data: {
        jobPostingId,
        type: "EMAIL_CV",
        order: nextOrder,
        config: JSON.parse(JSON.stringify(config))
      }
    });
  } else if (type === "QUESTIONNAIRE") {
    const parsed = parseQuestionnaireQuestions(formData);
    if ("error" in parsed) return parsed;

    const config: QuestionnaireStepConfig = { questions: parsed.questions };

    await db.jobPostingStep.create({
      data: {
        jobPostingId,
        type: "QUESTIONNAIRE",
        order: nextOrder,
        config: JSON.parse(JSON.stringify(config))
      }
    });
  } else if (type === "INTERVIEW") {
    const interviewMode = formData.get("interviewMode") as string;
    const interviewerIdsRaw = formData.get("interviewerIds") as string;
    let interviewerIds: string[];
    try {
      interviewerIds = JSON.parse(interviewerIdsRaw || "[]");
    } catch {
      return { error: "Please choose at least one interviewer." };
    }
    interviewerIds = interviewerIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    const location = (formData.get("location") as string)?.trim();
    const availabilityStartRaw = formData.get("availabilityStart") as string;
    const availabilityEndRaw = formData.get("availabilityEnd") as string;
    const dailyStartTime = formData.get("dailyStartTime") as string;
    const dailyEndTime = formData.get("dailyEndTime") as string;

    if (interviewMode !== "ONLINE" && interviewMode !== "PHYSICAL") {
      return { error: "Please choose an interview type." };
    }

    if (interviewerIds.length < 1 || interviewerIds.length > 3) {
      return { error: "Choose between one and three interviewers." };
    }

    if (new Set(interviewerIds).size !== interviewerIds.length) {
      return { error: "Each interviewer must be different." };
    }

    const activeInterviewers = await db.employment.findMany({
      where: { id: { in: interviewerIds }, status: "ACTIVE" },
      select: { id: true }
    });
    if (activeInterviewers.length !== interviewerIds.length) {
      return { error: "Please choose active employees as interviewers." };
    }

    if (interviewMode === "PHYSICAL" && !location) {
      return { error: "Please provide a location for the physical interview." };
    }

    if (!availabilityStartRaw || !availabilityEndRaw) {
      return { error: "Please choose an availability date range." };
    }

    if (!dailyStartTime || !dailyEndTime) {
      return { error: "Please choose the daily interview hours." };
    }

    const availabilityStart = new Date(`${availabilityStartRaw}T00:00:00`);
    const availabilityEnd = new Date(`${availabilityEndRaw}T23:59:59`);

    if (availabilityEnd < availabilityStart) {
      return { error: "The availability end date must be after the start date." };
    }

    if (dailyEndTime <= dailyStartTime) {
      return { error: "Daily end time must be after the start time." };
    }

    if (generateDaySlots(dailyStartTime, dailyEndTime).length === 0) {
      return { error: "The daily hours must allow at least one 30-minute slot." };
    }

    await db.jobPostingStep.create({
      data: {
        jobPostingId,
        type: "INTERVIEW",
        order: nextOrder,
        interviewMode,
        interviewerId: interviewerIds[0],
        config: JSON.parse(JSON.stringify({ interviewerIds } satisfies InterviewStepConfig)),
        location: interviewMode === "PHYSICAL" ? location : null,
        availabilityStart,
        availabilityEnd,
        dailyStartTime,
        dailyEndTime
      }
    });
  } else {
    return { error: "Unknown step type." };
  }

  revalidatePath(`/jobs/${jobPostingId}/application-steps`);

  return { success: "Step added." };
}

export async function updateJobStep(
  prevState: StepFormState,
  formData: FormData
): Promise<StepFormState> {
  const user = await getCurrentUser();

  if (!isHr(user)) {
    return { error: "Unauthorized: Only HR can configure job steps." };
  }

  const stepId = formData.get("stepId") as string;
  const jobPostingId = formData.get("jobPostingId") as string;
  if (!stepId || !jobPostingId) return { error: "Missing step reference." };

  const step = await db.jobPostingStep.findFirst({
    where: {
      id: stepId,
      jobPostingId,
      jobPosting: { organizationId: user!.organizationId }
    },
    include: { jobPosting: { select: { status: true } } }
  });
  if (!step) return { error: "This job step no longer exists." };
  if (step.jobPosting.status !== "DRAFT") {
    return { error: "Published job postings cannot be changed." };
  }

  if (step.type === "QUESTIONNAIRE") {
    const parsed = parseQuestionnaireQuestions(formData);
    if ("error" in parsed) return parsed;

    await db.jobPostingStep.update({
      where: { id: stepId },
      data: { config: JSON.parse(JSON.stringify({ questions: parsed.questions })) }
    });
  } else if (step.type === "EMAIL_CV") {
    const email = (formData.get("email") as string)?.trim();
    const instructions = (formData.get("instructions") as string)?.trim();
    if (!email || !email.includes("@")) {
      return { error: "A valid email address is required for this step." };
    }

    const config: EmailCvStepConfig = { email, instructions: instructions || undefined };
    await db.jobPostingStep.update({
      where: { id: stepId },
      data: { config: JSON.parse(JSON.stringify(config)) }
    });
  } else if (step.type === "INTERVIEW") {
    const interviewMode = formData.get("interviewMode") as string;
    const interviewerIdsRaw = formData.get("interviewerIds") as string;
    let interviewerIds: string[];
    try {
      interviewerIds = JSON.parse(interviewerIdsRaw || "[]");
    } catch {
      return { error: "Please choose at least one interviewer." };
    }
    interviewerIds = interviewerIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    const location = (formData.get("location") as string)?.trim();
    const availabilityStartRaw = formData.get("availabilityStart") as string;
    const availabilityEndRaw = formData.get("availabilityEnd") as string;
    const dailyStartTime = formData.get("dailyStartTime") as string;
    const dailyEndTime = formData.get("dailyEndTime") as string;

    if (interviewMode !== "ONLINE" && interviewMode !== "PHYSICAL") {
      return { error: "Please choose an interview type." };
    }
    if (interviewerIds.length < 1 || interviewerIds.length > 3) {
      return { error: "Choose between one and three interviewers." };
    }
    if (new Set(interviewerIds).size !== interviewerIds.length) {
      return { error: "Each interviewer must be different." };
    }
    const activeInterviewers = await db.employment.findMany({
      where: {
        id: { in: interviewerIds },
        status: "ACTIVE",
        organizationId: user!.organizationId
      },
      select: { id: true }
    });
    if (activeInterviewers.length !== interviewerIds.length) {
      return { error: "Please choose active employees as interviewers." };
    }
    if (interviewMode === "PHYSICAL" && !location) {
      return { error: "Please provide a location for the physical interview." };
    }
    if (!availabilityStartRaw || !availabilityEndRaw) {
      return { error: "Please choose an availability date range." };
    }
    if (!dailyStartTime || !dailyEndTime) {
      return { error: "Please choose the daily interview hours." };
    }

    const availabilityStart = new Date(`${availabilityStartRaw}T00:00:00`);
    const availabilityEnd = new Date(`${availabilityEndRaw}T23:59:59`);
    if (availabilityEnd < availabilityStart) {
      return { error: "The availability end date must be after the start date." };
    }
    if (dailyEndTime <= dailyStartTime) {
      return { error: "Daily end time must be after the start time." };
    }
    if (generateDaySlots(dailyStartTime, dailyEndTime).length === 0) {
      return { error: "The daily hours must allow at least one 30-minute slot." };
    }

    await db.jobPostingStep.update({
      where: { id: stepId },
      data: {
        interviewMode,
        interviewerId: interviewerIds[0],
        config: JSON.parse(JSON.stringify({ interviewerIds } satisfies InterviewStepConfig)),
        location: interviewMode === "PHYSICAL" ? location : null,
        availabilityStart,
        availabilityEnd,
        dailyStartTime,
        dailyEndTime
      }
    });
  }

  revalidatePath(`/jobs/${jobPostingId}/application-steps`);
  return { success: "Questionnaire updated." };
}

export async function deleteJobStep(formData: FormData) {
  const user = await getCurrentUser();

  if (!isHr(user)) {
    throw new Error("Unauthorized");
  }

  const stepId = formData.get("stepId") as string;
  const jobPostingId = formData.get("jobPostingId") as string;

  if (!stepId || !jobPostingId) return;

  await db.jobPostingStep.deleteMany({
    where: {
      id: stepId,
      jobPostingId,
      jobPosting: { organizationId: user!.organizationId, status: "DRAFT" }
    }
  });

  revalidatePath(`/jobs/${jobPostingId}/application-steps`);
}

export type AvailableSlotsResult = { slots: string[]; error?: string };

// Callable directly from client components (not just as a <form action>).
export async function getAvailableInterviewSlots(
  stepId: string,
  dateStr: string
): Promise<AvailableSlotsResult> {
  const step = await db.jobPostingStep.findUnique({ where: { id: stepId } });

  if (!step || step.type !== "INTERVIEW" || !step.dailyStartTime || !step.dailyEndTime) {
    return { slots: [], error: "This interview step is not configured correctly." };
  }

  // Get all interviewers from config
  const config = step.config as InterviewStepConfig | null;
  const interviewerIds = config?.interviewerIds?.length
    ? config.interviewerIds
    : step.interviewerId
      ? [step.interviewerId]
      : [];

  if (interviewerIds.length === 0) {
    return { slots: [], error: "This interview step is not configured correctly." };
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { slots: [] };
  }

  if (step.availabilityStart && date < step.availabilityStart) return { slots: [] };
  if (step.availabilityEnd && date > step.availabilityEnd) return { slots: [] };

  const allSlots = generateDaySlots(step.dailyStartTime, step.dailyEndTime);

  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);

  // Check bookings for ALL interviewers
  const allBookings = await db.interviewerBooking.findMany({
    where: {
      interviewerId: { in: interviewerIds },
      scheduledAt: { gte: dayStart, lte: dayEnd }
    },
    select: { interviewerId: true, scheduledAt: true }
  });

  // Group bookings by interviewer
  const bookingsByInterviewer = new Map<string, Set<string>>();
  for (const id of interviewerIds) {
    bookingsByInterviewer.set(id, new Set());
  }
  for (const booking of allBookings) {
    const times = bookingsByInterviewer.get(booking.interviewerId) || new Set();
    const timeStr = `${String(booking.scheduledAt.getHours()).padStart(2, "0")}:${String(booking.scheduledAt.getMinutes()).padStart(2, "0")}`;
    times.add(timeStr);
    bookingsByInterviewer.set(booking.interviewerId, times);
  }

  // Find slots where ALL interviewers are available
  const availableSlots = allSlots.filter((slot) => {
    for (const bookedTimes of bookingsByInterviewer.values()) {
      if (bookedTimes.has(slot)) {
        return false;
      }
    }
    return true;
  });

  return { slots: availableSlots };
}
