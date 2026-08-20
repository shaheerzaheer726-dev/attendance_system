"use client";

import { useState } from "react";
import { EmailCvStepForm } from "./email-cv-step-form";
import { QuestionnaireStepForm } from "./questionnaire-step-form";
import { InterviewStepForm } from "./interview-step-form";

type StepType = "EMAIL_CV" | "QUESTIONNAIRE" | "INTERVIEW";

export function AddStepPanel({
  jobPostingId,
  employees,
  steps
}: {
  jobPostingId: string;
  employees: { id: string; fullName: string }[];
  steps: { type: string }[];
}) {
  const [selectedType, setSelectedType] = useState<StepType | null>(null);
  const hasEmailStep = steps.some((step) => step.type === "EMAIL_CV");

  return (
    <div className="form-panel">
      <div>
        <h2>Add a Step</h2>
        <p className="muted">
          Candidates will need to complete every step you add, in order, to submit their
          application.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {!hasEmailStep && (
          <button
            type="button"
            className={selectedType === "EMAIL_CV" ? "btn-primary" : "back-link"}
            style={{ cursor: "pointer", padding: "10px 16px" }}
            onClick={() => setSelectedType(selectedType === "EMAIL_CV" ? null : "EMAIL_CV")}
          >
            + Email CV
          </button>
        )}
        <button
          type="button"
          className={selectedType === "QUESTIONNAIRE" ? "btn-primary" : "back-link"}
          style={{ cursor: "pointer", padding: "10px 16px" }}
          onClick={() => setSelectedType(selectedType === "QUESTIONNAIRE" ? null : "QUESTIONNAIRE")}
        >
          + Questionnaire
        </button>
        <button
          type="button"
          className={selectedType === "INTERVIEW" ? "btn-primary" : "back-link"}
          style={{ cursor: "pointer", padding: "10px 16px" }}
          onClick={() => setSelectedType(selectedType === "INTERVIEW" ? null : "INTERVIEW")}
        >
          + Interview
        </button>
      </div>

      {selectedType === "EMAIL_CV" && (
        <EmailCvStepForm jobPostingId={jobPostingId} onAdded={() => setSelectedType(null)} />
      )}

      {selectedType === "QUESTIONNAIRE" && (
        <QuestionnaireStepForm
          jobPostingId={jobPostingId}
          onAdded={() => setSelectedType(null)}
          onClose={() => setSelectedType(null)}
        />
      )}

      {selectedType === "INTERVIEW" && (
        <InterviewStepForm
          jobPostingId={jobPostingId}
          employees={employees}
          onAdded={() => setSelectedType(null)}
        />
      )}
    </div>
  );
}
