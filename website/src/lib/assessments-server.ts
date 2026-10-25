import "server-only";

import { rest } from "@/lib/rest";

import type { Assessment } from "@/lib/assessments";

export interface CreateAssessmentArgs {
  courseCode: string;
  title: string;
  type: AssessmentType;
  dueAt: string; // ISO string
  studentId: string;
  reminders?: { offset_hours: number; channel: string }[];
}

export type AssessmentType = "exam" | "test" | "assignment";

export interface AssessmentReminder {
  id: string;
  assessment_id: string;
  student_id: string;
  offset_hours: number;
  channel: "browser" | "email" | "both";
  sent: boolean;
  sent_at: string | null;
}

const DEFAULT_REMINDERS: { offset_hours: number; label: string }[] = [
  { offset_hours: 168, label: "1 week before" },
  { offset_hours: 24, label: "1 day before" },
  { offset_hours: 1, label: "1 hour before" },
];

export function defaultReminders() {
  return DEFAULT_REMINDERS;
}

/* --------------------------------------------------------------- reading */

export async function getAssessments(studentId?: string): Promise<Assessment[]> {
  let path = "assessments?select=*&order=due_at.asc";
  if (studentId) {
    path += `&student_id=eq.${encodeURIComponent(studentId)}`;
  }
  const rows = await rest<Assessment[]>(path);
  return rows ?? [];
}

export async function getAssessmentById(
  id: string
): Promise<Assessment | null> {
  const rows = await rest<Assessment[]>(
    `assessments?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows?.[0] ?? null;
}

export async function getAssessmentReminders(
  assessmentId: string
): Promise<AssessmentReminder[]> {
  const rows = await rest<AssessmentReminder[]>(
    `assessment_reminders?assessment_id=eq.${encodeURIComponent(assessmentId)}&select=*&order=offset_hours.asc`
  );
  return rows ?? [];
}

/* -------------------------------------------------------------- writing */

export async function createAssessment(args: CreateAssessmentArgs) {
  const row = {
    course_code: args.courseCode,
    title: args.title,
    type: args.type,
    due_at: args.dueAt,
    student_id: args.studentId,
  };

  const created = await rest<Assessment[]>("assessments", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });

  const assessment = created[0] as Assessment;

  // Default reminders if none supplied.
  const reminders = args.reminders ?? DEFAULT_REMINDERS.map((r) => ({
    offset_hours: r.offset_hours,
    channel: "browser" as const,
  }));

  if (reminders.length > 0) {
    await rest("assessment_reminders", {
      method: "POST",
      body: reminders.map((r) => ({
        assessment_id: assessment.id,
        student_id: args.studentId,
        offset_hours: r.offset_hours,
        channel: r.channel as "browser" | "email" | "both",
      })),
      prefer: "return=minimal",
    });
  }

  return assessment;
}

export interface UpdateAssessmentArgs {
  title?: string;
  type?: AssessmentType;
  dueAt?: string;
  reminders?: { offset_hours: number; channel: string }[] | null;
}

export async function updateAssessment(
  id: string,
  args: UpdateAssessmentArgs
) {
  const body: Record<string, unknown> = {};
  if (args.title !== undefined) body.title = args.title;
  if (args.type !== undefined) body.type = args.type;
  if (args.dueAt !== undefined) body.due_at = args.dueAt;
  if (Object.keys(body).length > 0) {
    body.updated_at = new Date().toISOString();
    await rest(`assessments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
  }

  // Replace reminders when supplied.
  if (args.reminders !== undefined) {
    await rest(
      `assessment_reminders?assessment_id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (args.reminders && args.reminders.length > 0) {
      // Need the assessment row to know the student_id.
      const assessment = await getAssessmentById(id);
      if (assessment) {
        await rest("assessment_reminders", {
          method: "POST",
          body: args.reminders.map((r) => ({
            assessment_id: id,
            student_id: assessment.student_id,
            offset_hours: r.offset_hours,
            channel: r.channel as "browser" | "email" | "both",
          })),
          prefer: "return=minimal",
        });
      }
    }
  }
}

export async function deleteAssessment(id: string): Promise<void> {
  // Deleting the assessment cascades to reminders via the FK.
  await rest(`assessments?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
