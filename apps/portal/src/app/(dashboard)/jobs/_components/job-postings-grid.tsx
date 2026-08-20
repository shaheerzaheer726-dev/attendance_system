import Link from "next/link";
import { deleteJobPosting, setJobPostingStatus } from "../actions";
import type { getJobPostings } from "../queries";

type Job = Awaited<ReturnType<typeof getJobPostings>>[number];

function JobActions({ job, isHr }: { job: Job; isHr: boolean }) {
  const actionStyle = {
    minWidth: 120,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  };
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}
    >
      <Link href={`/jobs/${job.id}`} className="btn-primary" style={actionStyle}>
        View & Apply
      </Link>
      {isHr && (
        <>
          <Link href={`/jobs/${job.id}/applications`} className="back-link" style={actionStyle}>
            Responses ({job._count.applications})
          </Link>
          <form action={setJobPostingStatus} style={{ display: "flex" }}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="status" value={job.status === "OPEN" ? "CLOSED" : "OPEN"} />
            <button type="submit" className="back-link" style={actionStyle}>
              {job.status === "OPEN" ? "Close posting" : "Reopen posting"}
            </button>
          </form>
          <form action={deleteJobPosting} style={{ display: "flex" }}>
            <input type="hidden" name="id" value={job.id} />
            <button
              type="submit"
              className="back-link"
              style={{
                ...actionStyle,
                color: "#f87171",
                borderColor: "rgba(248, 113, 113, 0.4)"
              }}
            >
              Delete
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function JobCard({ job, isHr }: { job: Job; isHr: boolean }) {
  const open = job.status === "OPEN";
  return (
    <article className="panel" style={{ cursor: "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>{job.title}</h2>
        <span className="status-badge" style={{ color: open ? "#6ee7b7" : "#94a3b8" }}>
          {job.status}
        </span>
      </div>
      <p className="muted">
        {[job.department, job.location, job.employmentType].filter(Boolean).join(" · ") ||
          "Details inside"}
      </p>
      <p className="muted">
        Posted{" "}
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }).format(job.createdAt)}
      </p>
      <JobActions job={job} isHr={isHr} />
    </article>
  );
}

export function JobPostingsGrid({ jobs, isHr }: { jobs: Job[]; isHr: boolean }) {
  if (!jobs.length)
    return (
      <section className="panel">
        <p className="muted">There are no open positions right now. Please check back later.</p>
      </section>
    );
  return (
    <section className="panel-grid" aria-label="Job postings">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} isHr={isHr} />
      ))}
    </section>
  );
}
