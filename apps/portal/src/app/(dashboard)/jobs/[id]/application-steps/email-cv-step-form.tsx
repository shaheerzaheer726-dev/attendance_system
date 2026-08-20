"use client";

import { useActionState, useRef, useEffect } from "react";
import { addJobStep, updateJobStep, type StepFormState } from "../../steps-actions";
import type { EmailCvStepConfig } from "../../step-types";
import { StepEditDialog } from "./_components/step-edit-dialog";

const initialState: StepFormState = {};

export function EmailCvStepForm({
  jobPostingId,
  onAdded,
  stepId,
  initialConfig,
  onClose
}: {
  jobPostingId: string;
  onAdded: () => void;
  stepId?: string;
  initialConfig?: EmailCvStepConfig;
  onClose?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    stepId ? updateJobStep : addJobStep,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onAdded();
      onClose?.();
    }
  }, [state.success]);

  const form = (
    <div
      style={{
        borderTop: stepId ? "none" : "1px solid rgba(148, 163, 184, 0.2)",
        paddingTop: stepId ? 0 : "16px",
        marginTop: stepId ? 0 : "8px"
      }}
    >
      {state.error && (
        <div className="alert-error" role="alert">
          ⚠️ {state.error}
        </div>
      )}

      <form ref={formRef} action={formAction}>
        <input type="hidden" name="jobPostingId" value={jobPostingId} />
        <input type="hidden" name="stepId" value={stepId ?? ""} />
        <input type="hidden" name="type" value="EMAIL_CV" />

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="email">CV Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="e.g. hiring@company.com"
              defaultValue={initialConfig?.email}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="instructions">Instructions (optional)</label>
          <textarea
            id="instructions"
            name="instructions"
            className="form-control"
            placeholder="e.g. Please use the subject line 'Application - [Your Name]'"
            rows={3}
            defaultValue={initialConfig?.instructions}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving..." : stepId ? "Save Changes" : "Add Step"}
        </button>
      </form>
    </div>
  );

  return stepId ? (
    <StepEditDialog title="Edit Email CV" onClose={onClose ?? (() => undefined)}>
      {form}
    </StepEditDialog>
  ) : (
    form
  );
}
