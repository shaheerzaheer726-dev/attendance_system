import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCurrentUser } from "../../../../../lib/session";
import { logout } from "../../../../(auth)/login/actions";
import { isHr } from "../../permissions";
import { AddStepPanel } from "./add-step-panel";
import { JobStepsList } from "./_components/job-steps-list";
import { getJobStepsData } from "./queries";

export const dynamic = "force-dynamic";

export default async function JobStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  if (!isHr(user)) redirect("/jobs");
  const { id } = await params;
  const data = await getJobStepsData(id);
  if (!data.job) notFound();
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/jobs" className="back-link">
            ← Jobs
          </Link>
          <h1>Application Steps: {data.job.title}</h1>
          <p className="muted">
            Optional. Add steps candidates must complete to apply, or return to Jobs.
          </p>
        </div>
        <div>
          <Link href={`/jobs/${id}`} className="back-link">
            View Posting
          </Link>
          <form action={logout}>
            <button type="submit" className="logout-btn">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <JobStepsList jobId={id} steps={data.job.steps} employees={data.employees} />
      <AddStepPanel jobPostingId={id} employees={data.employees} steps={data.job.steps} />
      <div style={{ marginTop: 24 }}>
        <Link href="/jobs" className="btn-primary">
          Done — Back to Jobs
        </Link>
      </div>
    </main>
  );
}
