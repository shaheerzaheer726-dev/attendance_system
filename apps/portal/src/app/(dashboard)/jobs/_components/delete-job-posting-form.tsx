"use client";

import { deleteJobPosting } from "../actions";

export function DeleteJobPostingForm({
  jobId,
  style
}: {
  jobId: string;
  style: React.CSSProperties;
}) {
  return (
    <form
      action={deleteJobPosting}
      style={{ display: "flex" }}
      onSubmit={(event) => {
        if (!window.confirm("Delete this job posting and all of its applications?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={jobId} />
      <button
        type="submit"
        className="back-link"
        style={{
          ...style,
          color: "#f87171",
          borderColor: "rgba(248, 113, 113, 0.4)"
        }}
      >
        Delete
      </button>
    </form>
  );
}
