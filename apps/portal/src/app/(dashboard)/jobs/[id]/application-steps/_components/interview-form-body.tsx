import { AvailabilityFields, InterviewDetails } from "./interview-step-fields";

export function InterviewFormBody({
  jobPostingId,
  stepId,
  state,
  formAction,
  isPending,
  employees,
  mode,
  interviewerIds,
  availabilityStart,
  availabilityEnd,
  minimumDate,
  location,
  dailyStartTime,
  dailyEndTime,
  onModeChange,
  onInterviewerChange,
  onInterviewerAdd,
  onInterviewerRemove,
  onStartChange,
  onEndChange
}: {
  jobPostingId: string;
  stepId?: string;
  state: { error?: string };
  formAction: (formData: FormData) => void;
  isPending: boolean;
  employees: { id: string; fullName: string }[];
  mode: "ONLINE" | "PHYSICAL";
  interviewerIds: string[];
  availabilityStart: string;
  availabilityEnd: string;
  minimumDate: string;
  location?: string | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  onModeChange: (mode: "ONLINE" | "PHYSICAL") => void;
  onInterviewerChange: (index: number, value: string) => void;
  onInterviewerAdd: () => void;
  onInterviewerRemove: (index: number) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(148, 163, 184, 0.2)",
        paddingTop: "16px",
        marginTop: "8px"
      }}
    >
      {state.error && (
        <div className="alert-error" role="alert">
          ⚠️ {state.error}
        </div>
      )}
      <form action={formAction}>
        <input type="hidden" name="jobPostingId" value={jobPostingId} />
        <input type="hidden" name="stepId" value={stepId ?? ""} />
        <input type="hidden" name="type" value="INTERVIEW" />
        <input
          type="hidden"
          name="interviewerIds"
          value={JSON.stringify(interviewerIds.filter(Boolean))}
        />
        <InterviewDetails
          employees={employees}
          mode={mode}
          onModeChange={onModeChange}
          interviewerIds={interviewerIds}
          onInterviewerChange={onInterviewerChange}
          onInterviewerAdd={onInterviewerAdd}
          onInterviewerRemove={onInterviewerRemove}
          location={location}
        />
        <AvailabilityFields
          minimumDate={minimumDate}
          availabilityStart={availabilityStart}
          availabilityEnd={availabilityEnd}
          onStartChange={onStartChange}
          onEndChange={onEndChange}
          dailyStartTime={dailyStartTime}
          dailyEndTime={dailyEndTime}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending}
          style={{ marginTop: "8px" }}
        >
          {isPending ? "Saving..." : stepId ? "Save Changes" : "Add Step"}
        </button>
      </form>
    </div>
  );
}
