import { createPrismaClient } from "@attendance/db";
import { employmentIdentityInclude, getEmploymentName } from "../../../../../lib/employment";
import type { InterviewStepConfig } from "../../../step-types";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export async function getJobStepsData(id: string) {
  const [job, employmentRecords] = await Promise.all([
    db.jobPosting.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: { interviewer: { include: employmentIdentityInclude } }
        }
      }
    }),
    db.employment.findMany({
      where: { status: "ACTIVE" },
      include: employmentIdentityInclude,
      orderBy: { employeeCode: "asc" }
    })
  ]);
  const employees = employmentRecords.map((employment) => ({
    id: employment.id,
    fullName: getEmploymentName(employment)
  }));
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.fullName]));
  return {
    job: job
      ? {
          ...job,
          steps: job.steps.map((step) => ({
            ...step,
            interviewer: step.interviewer
              ? { fullName: getEmploymentName(step.interviewer) }
              : null,
            interviewers: (() => {
              const config = step.config as InterviewStepConfig | null;
              const ids = config?.interviewerIds?.length
                ? config.interviewerIds
                : step.interviewerId
                  ? [step.interviewerId]
                  : [];
              return ids
                .map((id) => employeeNames.get(id))
                .filter((name): name is string => Boolean(name));
            })()
          }))
        }
      : null,
    employees
  };
}
