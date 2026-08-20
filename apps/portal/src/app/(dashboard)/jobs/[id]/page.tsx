import Link from "next/link";
import { notFound } from "next/navigation";
import { createPrismaClient } from "@attendance/db";
import { getCurrentUser } from "../../../../lib/session";
import { logout } from "../../../(auth)/login/actions";
import { isHr } from "../permissions";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function JobDescription({
  createdAt,
  creatorName,
  description,
  status
}: {
  createdAt: Date;
  creatorName: string;
  description: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
}) {
  const statusStyle =
    status === "OPEN"
      ? {
          background: "rgba(16, 185, 129, 0.15)",
          color: "#6ee7b7",
          border: "1px solid rgba(16, 185, 129, 0.4)"
        }
      : {
          background: "rgba(148, 163, 184, 0.15)",
          color: "#94a3b8",
          border: "1px solid rgba(148, 163, 184, 0.4)"
        };

  return (
    <section className="panel" style={{ cursor: "default", marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px"
        }}
      >
        <h2>Job Description</h2>
        <span className="status-badge" style={statusStyle}>
          {status}
        </span>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "16px" }}>
        Posted {formatDate(createdAt)} by {creatorName}
      </p>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{description}</p>
    </section>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsHr = isHr(user);

  const job = await db.jobPosting.findUnique({
    where: { id },
    include: {
      createdBy: { include: { person: { select: { legalName: true, preferredName: true } } } },
      steps: {
        orderBy: { order: "asc" },
        include: {
          interviewer: {
            include: {
              membership: {
                include: { person: { select: { legalName: true, preferredName: true } } }
              }
            }
          }
        }
      }
    }
  });

  if (!job) {
    notFound();
  }

  if (job.status !== "OPEN" && !userIsHr) {
    notFound();
  }

  const applicationSteps = job.steps.map((step) => ({
    ...step,
    interviewer: step.interviewer
      ? {
          fullName:
            step.interviewer.membership.person.preferredName ??
            step.interviewer.membership.person.legalName
        }
      : null
  }));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/jobs" className="back-link">
            ← Jobs
          </Link>
          <h1>{job.title}</h1>
          <p className="muted">
            {[job.department, job.location, job.employmentType].filter(Boolean).join(" · ") ||
              "No additional details"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {userIsHr && (
            <Link
              href={`/jobs/${job.id}/applications`}
              className="back-link"
              style={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "#c084fc" }}
            >
              View Responses
            </Link>
          )}
          {user && (
            <form action={logout}>
              <button type="submit" className="logout-btn">
                Sign Out
              </button>
            </form>
          )}
        </div>
      </header>

      <JobDescription
        createdAt={job.createdAt}
        creatorName={job.createdBy.person.preferredName ?? job.createdBy.person.legalName}
        description={job.description}
        status={job.status}
      />

      {job.status === "OPEN" ? (
        <ApplyForm jobPostingId={job.id} steps={applicationSteps} />
      ) : (
        <section className="panel" style={{ cursor: "default" }}>
          <p className="muted">This position is not currently accepting applications.</p>
        </section>
      )}
    </main>
  );
}
