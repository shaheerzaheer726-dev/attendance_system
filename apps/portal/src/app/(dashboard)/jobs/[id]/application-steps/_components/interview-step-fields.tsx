export function InterviewDetails({
  employees,
  mode,
  onModeChange,
  interviewerIds,
  onInterviewerChange,
  onInterviewerAdd,
  onInterviewerRemove,
  location
}: {
  employees: { id: string; fullName: string }[];
  mode: "ONLINE" | "PHYSICAL";
  onModeChange: (mode: "ONLINE" | "PHYSICAL") => void;
  interviewerIds: string[];
  onInterviewerChange: (index: number, value: string) => void;
  onInterviewerAdd: () => void;
  onInterviewerRemove: (index: number) => void;
  location?: string | null;
}) {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label htmlFor="interviewMode">Interview Type *</label>
        <select
          id="interviewMode"
          name="interviewMode"
          className="form-control"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as "ONLINE" | "PHYSICAL")}
        >
          <option value="ONLINE">Online</option>
          <option value="PHYSICAL">Physical</option>
        </select>
      </div>
      <div className="form-group">
        <label>Interviewers (up to 3) *</label>
        {interviewerIds.map((selectedId, index) => (
          <div key={index} style={{ display: "flex", gap: "8px" }}>
            <select
              id={`interviewerId-${index}`}
              name={index === 0 ? "interviewerId" : `interviewerId-${index}`}
              className="form-control"
              value={selectedId}
              onChange={(event) => onInterviewerChange(index, event.target.value)}
              required
            >
              <option value="" disabled>
                Choose an employee
              </option>
              {employees
                .filter(
                  (employee) => !interviewerIds.includes(employee.id) || employee.id === selectedId
                )
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
            </select>
            {index > 0 && (
              <button
                type="button"
                className="back-link"
                onClick={() => onInterviewerRemove(index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {interviewerIds.length < 3 && interviewerIds.every(Boolean) && (
          <button type="button" className="back-link" onClick={onInterviewerAdd}>
            + Add Interviewer
          </button>
        )}
      </div>
      {mode === "PHYSICAL" && (
        <div className="form-group">
          <label htmlFor="location">Interview Location *</label>
          <input
            id="location"
            name="location"
            className="form-control"
            placeholder="e.g. Head Office, 3rd Floor Conference Room"
            defaultValue={location ?? ""}
            required
          />
        </div>
      )}
    </div>
  );
}

export function AvailabilityFields({
  minimumDate,
  availabilityStart,
  availabilityEnd,
  onStartChange,
  onEndChange,
  dailyStartTime,
  dailyEndTime
}: {
  minimumDate: string;
  availabilityStart: string;
  availabilityEnd: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
}) {
  return (
    <>
      <p className="muted">
        Candidates will pick a 30-minute slot within the window below. Weekends are excluded
        automatically.
      </p>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="availabilityStart">Available From *</label>
          <input
            id="availabilityStart"
            name="availabilityStart"
            type="date"
            className="form-control"
            min={minimumDate}
            value={availabilityStart}
            onChange={(event) => onStartChange(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="availabilityEnd">Available Until *</label>
          <input
            id="availabilityEnd"
            name="availabilityEnd"
            type="date"
            className="form-control"
            min={availabilityStart || minimumDate}
            value={availabilityEnd}
            onChange={(event) => onEndChange(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="dailyStartTime">Daily Start Time *</label>
          <input
            id="dailyStartTime"
            name="dailyStartTime"
            type="time"
            className="form-control"
            defaultValue={dailyStartTime ?? "09:00"}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="dailyEndTime">Daily End Time *</label>
          <input
            id="dailyEndTime"
            name="dailyEndTime"
            type="time"
            className="form-control"
            defaultValue={dailyEndTime ?? "17:00"}
            required
          />
        </div>
      </div>
    </>
  );
}
