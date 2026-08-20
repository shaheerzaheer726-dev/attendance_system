"use client";

import { useActionState, useEffect, useState } from "react";
import { addJobStep, updateJobStep, type StepFormState } from "../../steps-actions";
import { InterviewFormBody } from "./_components/interview-form-body";
import { StepEditDialog } from "./_components/step-edit-dialog";

const initialState: StepFormState = {};

export function InterviewStepForm({
  jobPostingId,
  employees,
  onAdded,
  stepId,
  initialValues,
  onClose
}: {
  jobPostingId: string;
  employees: { id: string; fullName: string }[];
  onAdded: () => void;
  stepId?: string;
  initialValues?: {
    mode: "ONLINE" | "PHYSICAL";
    interviewerIds: string[];
    location?: string | null;
    availabilityStart?: string;
    availabilityEnd?: string;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
  };
  onClose?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    stepId ? updateJobStep : addJobStep,
    initialState
  );
  const [mode, setMode] = useState<"ONLINE" | "PHYSICAL">(initialValues?.mode ?? "ONLINE");
  const [interviewerIds, setInterviewerIds] = useState<string[]>(
    initialValues?.interviewerIds.length ? initialValues.interviewerIds : [""]
  );
  const [availabilityStart, setAvailabilityStart] = useState(
    initialValues?.availabilityStart ?? ""
  );
  const [availabilityEnd, setAvailabilityEnd] = useState(initialValues?.availabilityEnd ?? "");

  useEffect(() => {
    if (state.success) {
      setMode("ONLINE");
      setInterviewerIds([""]);
      setAvailabilityStart("");
      setAvailabilityEnd("");
      onAdded();
      onClose?.();
    }
  }, [state.success]);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  function handleStartChange(value: string) {
    setAvailabilityStart(value);
    if (availabilityEnd && availabilityEnd < value) setAvailabilityEnd("");
  }

  function handleInterviewerChange(index: number, value: string) {
    setInterviewerIds((prev) =>
      prev.map((id, currentIndex) => (currentIndex === index ? value : id))
    );
  }

  function addInterviewer() {
    setInterviewerIds((prev) => (prev.length < 3 ? [...prev, ""] : prev));
  }

  function removeInterviewer(index: number) {
    setInterviewerIds((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  const form = (
    <InterviewFormBody
      jobPostingId={jobPostingId}
      stepId={stepId}
      state={state}
      formAction={formAction}
      isPending={isPending}
      employees={employees}
      mode={mode}
      interviewerIds={interviewerIds}
      availabilityStart={availabilityStart}
      availabilityEnd={availabilityEnd}
      minimumDate={todayStr}
      location={initialValues?.location}
      dailyStartTime={initialValues?.dailyStartTime}
      dailyEndTime={initialValues?.dailyEndTime}
      onModeChange={setMode}
      onInterviewerChange={handleInterviewerChange}
      onInterviewerAdd={addInterviewer}
      onInterviewerRemove={removeInterviewer}
      onStartChange={handleStartChange}
      onEndChange={setAvailabilityEnd}
    />
  );

  return stepId ? (
    <StepEditDialog title="Edit Interview" onClose={onClose ?? (() => undefined)}>
      {form}
    </StepEditDialog>
  ) : (
    form
  );
}
