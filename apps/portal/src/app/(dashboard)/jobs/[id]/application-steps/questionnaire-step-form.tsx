"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { addJobStep, updateJobStep, type StepFormState } from "../../steps-actions";
import type { JobStepQuestion, QuestionnaireStepConfig } from "../../step-types";
import { QuestionEditor } from "./_components/question-editor";

const initialState: StepFormState = {};

let questionCounter = 0;
function newQuestionId() {
  questionCounter += 1;
  return `q${Date.now()}${questionCounter}`;
}

function blankQuestion(): JobStepQuestion {
  return { id: newQuestionId(), prompt: "", type: "TEXT" };
}

function QuestionnaireDialog({
  jobPostingId,
  stepId,
  state,
  formAction,
  isPending,
  questions,
  updateQuestion,
  removeQuestion,
  addQuestion,
  updateOption,
  addOption,
  removeOption,
  onClose
}: {
  jobPostingId: string;
  stepId?: string;
  state: StepFormState;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  questions: JobStepQuestion[];
  updateQuestion: (id: string, patch: Partial<JobStepQuestion>) => void;
  removeQuestion: (id: string) => void;
  addQuestion: () => void;
  updateOption: (questionId: string, index: number, value: string) => void;
  addOption: (questionId: string) => void;
  removeOption: (questionId: string, index: number) => void;
  onClose?: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="questionnaire-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "24px",
        background: "rgba(15, 23, 42, 0.55)"
      }}
    >
      <div
        className="form-panel"
        style={{ maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <h2 id="questionnaire-dialog-title">
            {stepId ? "Edit Questionnaire" : "Add Questionnaire"}
          </h2>
          <button type="button" className="back-link" onClick={onClose}>
            Close
          </button>
        </div>

        {state.error && (
          <div className="alert-error" role="alert">
            ⚠️ {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="jobPostingId" value={jobPostingId} />
          <input type="hidden" name="stepId" value={stepId ?? ""} />
          <input type="hidden" name="type" value="QUESTIONNAIRE" />
          <input type="hidden" name="questionsJson" value={JSON.stringify(questions)} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                canRemove={questions.length > 1}
                onChange={(patch) => updateQuestion(question.id, patch)}
                onRemove={() => removeQuestion(question.id)}
                onOptionChange={(optionIndex, value) =>
                  updateOption(question.id, optionIndex, value)
                }
                onOptionAdd={() => addOption(question.id)}
                onOptionRemove={(optionIndex) => removeOption(question.id, optionIndex)}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "16px" }}>
            <button type="button" className="back-link" onClick={addQuestion}>
              + Add Question
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Saving..." : stepId ? "Save Changes" : "Add Step"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function QuestionnaireStepForm({
  jobPostingId,
  onAdded,
  stepId,
  initialConfig,
  onClose
}: {
  jobPostingId: string;
  onAdded: () => void;
  stepId?: string;
  initialConfig?: QuestionnaireStepConfig;
  onClose?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    stepId ? updateJobStep : addJobStep,
    initialState
  );
  const [questions, setQuestions] = useState<JobStepQuestion[]>(
    initialConfig?.questions?.length ? initialConfig.questions : [blankQuestion()]
  );

  useEffect(() => {
    if (state.success) {
      setQuestions([blankQuestion()]);
      onAdded();
      onClose?.();
    }
  }, [state.success]);

  function updateQuestion(id: string, patch: Partial<JobStepQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function updateOption(questionId: string, index: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      })
    );
  }

  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId && q.options ? { ...q, options: [...q.options, ""] } : q
      )
    );
  }

  function removeOption(questionId: string, index: number) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options) return q;
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      })
    );
  }

  return (
    <QuestionnaireDialog
      jobPostingId={jobPostingId}
      stepId={stepId}
      state={state}
      formAction={formAction}
      isPending={isPending}
      questions={questions}
      updateQuestion={updateQuestion}
      removeQuestion={removeQuestion}
      addQuestion={addQuestion}
      updateOption={updateOption}
      addOption={addOption}
      removeOption={removeOption}
      onClose={onClose}
    />
  );
}
