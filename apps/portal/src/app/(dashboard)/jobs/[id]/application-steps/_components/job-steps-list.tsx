"use client";

import { useState } from "react";
import { deleteJobStep } from "../../../steps-actions";
import { EmailCvStepForm } from "../email-cv-step-form";
import { InterviewStepForm } from "../interview-step-form";
import { QuestionnaireStepForm } from "../questionnaire-step-form";
import type {
  EmailCvStepConfig,
  InterviewStepConfig,
  QuestionnaireStepConfig
} from "../../../step-types";
import type { getJobStepsData } from "../queries";

type Step = NonNullable<Awaited<ReturnType<typeof getJobStepsData>>["job"]>["steps"][number];
const labels: Record<string, string> = {
  EMAIL_CV: "Email CV",
  QUESTIONNAIRE: "Questionnaire",
  INTERVIEW: "Interview"
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function stepSummary(step: Step): string {
  if (step.type === "EMAIL_CV")
    return `Candidates confirm they emailed their CV to ${(step.config as EmailCvStepConfig | null)?.email ?? "—"}`;
  if (step.type === "QUESTIONNAIRE") {
    const count = (step.config as QuestionnaireStepConfig | null)?.questions?.length ?? 0;
    return `${count} question${count === 1 ? "" : "s"} for the candidate to answer`;
  }
  const mode =
    step.interviewMode === "ONLINE" ? "Online" : `Physical — ${step.location ?? "location TBD"}`;
  const interviewerNames = step.interviewers?.length
    ? step.interviewers.join(", ")
    : step.interviewer?.fullName;
  const interviewer = interviewerNames ? `with ${interviewerNames}` : "";
  const window =
    step.availabilityStart && step.availabilityEnd
      ? `${formatDate(step.availabilityStart)} – ${formatDate(step.availabilityEnd)}, ${step.dailyStartTime}–${step.dailyEndTime}`
      : "";
  return `${mode} interview ${interviewer} · ${window}`.trim();
}

export function JobStepsList({
  jobId,
  steps,
  employees,
  editable
}: {
  jobId: string;
  steps: Step[];
  employees: { id: string; fullName: string }[];
  editable: boolean;
}) {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  if (!steps.length) return null;
  const editingStep = steps.find((step) => step.id === editingStepId);
  return (
    <>
      <section style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {steps.map((step, index) => (
          <article key={step.id} className="panel" style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <span className="status-badge">
                  Step {index + 1} · {labels[step.type]}
                </span>
                <p>{stepSummary(step)}</p>
              </div>
              {editable && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="back-link"
                    onClick={() => setEditingStepId(step.id)}
                  >
                    Edit
                  </button>
                  <form action={deleteJobStep}>
                    <input type="hidden" name="stepId" value={step.id} />
                    <input type="hidden" name="jobPostingId" value={jobId} />
                    <button type="submit" className="back-link">
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
      {editingStep?.type === "EMAIL_CV" && (
        <EmailCvStepForm
          jobPostingId={jobId}
          stepId={editingStep.id}
          initialConfig={editingStep.config as EmailCvStepConfig}
          onAdded={() => setEditingStepId(null)}
          onClose={() => setEditingStepId(null)}
        />
      )}
      {editingStep?.type === "QUESTIONNAIRE" && (
        <QuestionnaireStepForm
          jobPostingId={jobId}
          stepId={editingStep.id}
          initialConfig={editingStep.config as QuestionnaireStepConfig}
          onAdded={() => setEditingStepId(null)}
          onClose={() => setEditingStepId(null)}
        />
      )}
      {editingStep?.type === "INTERVIEW" && (
        <InterviewStepForm
          jobPostingId={jobId}
          employees={employees}
          stepId={editingStep.id}
          initialValues={{
            mode: editingStep.interviewMode ?? "ONLINE",
            interviewerIds:
              (editingStep.config as InterviewStepConfig | null)?.interviewerIds ??
              (editingStep.interviewerId ? [editingStep.interviewerId] : []),
            location: editingStep.location,
            availabilityStart: editingStep.availabilityStart?.toISOString().slice(0, 10),
            availabilityEnd: editingStep.availabilityEnd?.toISOString().slice(0, 10),
            dailyStartTime: editingStep.dailyStartTime,
            dailyEndTime: editingStep.dailyEndTime
          }}
          onAdded={() => setEditingStepId(null)}
          onClose={() => setEditingStepId(null)}
        />
      )}
    </>
  );
}
