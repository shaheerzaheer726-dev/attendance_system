import type { JobStepQuestion, QuestionType } from "../../step-types";

interface QuestionEditorProps {
  question: JobStepQuestion;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<JobStepQuestion>) => void;
  onRemove: () => void;
  onOptionChange: (index: number, value: string) => void;
  onOptionAdd: () => void;
  onOptionRemove: (index: number) => void;
}

function QuestionOptions({
  question,
  onChange,
  onAdd,
  onRemove
}: {
  question: JobStepQuestion;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={question.allowMultiple ?? false}
          onChange={(event) => onChange(-1, String(event.target.checked))}
        />{" "}
        Allow selecting more than one option
      </label>
      {(question.options ?? []).map((option, index) => (
        <div key={index} style={{ display: "flex", gap: 8 }}>
          <input
            className="form-control"
            placeholder={`Option ${index + 1}`}
            value={option}
            onChange={(event) => onChange(index, event.target.value)}
            required
          />
          {(question.options?.length ?? 0) > 2 && (
            <button type="button" className="back-link" onClick={() => onRemove(index)}>
              ✕
            </button>
          )}
        </div>
      ))}
      <button type="button" className="back-link" onClick={onAdd}>
        + Add Option
      </button>
    </div>
  );
}

export function QuestionEditor({
  question,
  index,
  canRemove,
  onChange,
  onRemove,
  onOptionChange,
  onOptionAdd,
  onOptionRemove
}: QuestionEditorProps) {
  function handleOption(index: number, value: string) {
    if (index === -1) onChange({ allowMultiple: value === "true" });
    else onOptionChange(index, value);
  }
  return (
    <div className="panel" style={{ cursor: "default", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Question {index + 1}</strong>
        {canRemove && (
          <button type="button" className="back-link" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <div className="form-group">
        <label>Question Prompt *</label>
        <input
          className="form-control"
          value={question.prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Answer Type</label>
        <select
          className="form-control"
          value={question.type}
          onChange={(event) =>
            onChange({
              type: event.target.value as QuestionType,
              options: event.target.value === "MULTIPLE_CHOICE" ? ["", ""] : undefined,
              allowMultiple: false
            })
          }
        >
          <option value="TEXT">Text Answer</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
        </select>
      </div>
      {question.type === "MULTIPLE_CHOICE" && (
        <QuestionOptions
          question={question}
          onChange={handleOption}
          onAdd={onOptionAdd}
          onRemove={onOptionRemove}
        />
      )}
    </div>
  );
}
