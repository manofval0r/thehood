/**
 * Assessment types, helpers and pure client-side computations.
 *
 * Nothing here touches the database. These are safe to import from client
 * components, so the countdown cards and the form can render without
 * pulling in server-only code.
 */

export type AssessmentType = "exam" | "test" | "assignment";

export const DEFAULT_REMINDERS: { offset_hours: number; label: string }[] = [
  { offset_hours: 168, label: "1 week before" },
  { offset_hours: 24, label: "1 day before" },
  { offset_hours: 1, label: "1 hour before" },
];

export function defaultReminders() {
  return DEFAULT_REMINDERS;
}

export interface Assessment {
  id: string;
  course_code: string;
  title: string;
  type: AssessmentType;
  due_at: string;
  student_id: string;
  created_at: string;
  updated_at: string;
}

export interface UpcomingAssessment extends Assessment {
  /** Milliseconds remaining. May be negative when overdue. */
  remainingMs: number;
  /** Human readable: "in 3 days", "due today", "overdue by 2 days". */
  statusLabel: string;
  /** Urgency tier for colour. */
  urgency: "green" | "amber" | "red" | "done";
  /** Progress 0-1 based on time elapsed since a notional start. */
  progress: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/** Notional start: 14 days before the deadline, so a progress bar has a span. */
function notionalStart(dueAt: string): number {
  return new Date(dueAt).getTime() - 14 * MILLISECONDS_PER_DAY;
}

export function upcomingAssessments(
  assessments: Assessment[],
  now: Date = new Date()
): UpcomingAssessment[] {
  return assessments
    .map((a): UpcomingAssessment => {
      const due = new Date(a.due_at).getTime();
      const remainingMs = due - now.getTime();
      const start = notionalStart(a.due_at);
      const span = due - start;
      const elapsed = now.getTime() - start;
      const progress = span > 0 ? Math.max(0, Math.min(1, elapsed / span)) : 1;

      let statusLabel: string;
      let urgency: UpcomingAssessment["urgency"];

      if (remainingMs <= 0) {
        const overdueDays = Math.floor(Math.abs(remainingMs) / MILLISECONDS_PER_DAY);
        statusLabel =
          overdueDays === 0 ? "Due today" : `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`;
        urgency = "done";
      } else if (remainingMs < 24 * MILLISECONDS_PER_HOUR) {
        const hours = Math.floor(remainingMs / MILLISECONDS_PER_HOUR);
        statusLabel = `Due in ${hours} hour${hours === 1 ? "" : "s"}`;
        urgency = "red";
      } else if (remainingMs < 7 * MILLISECONDS_PER_DAY) {
        const days = Math.floor(remainingMs / MILLISECONDS_PER_DAY);
        statusLabel = `Due in ${days} day${days === 1 ? "" : "s"}`;
        urgency = "amber";
      } else {
        const days = Math.floor(remainingMs / MILLISECONDS_PER_DAY);
        statusLabel = `Due in ${days} days`;
        urgency = "green";
      }

      return { ...a, remainingMs, statusLabel, urgency, progress };
    })
    .sort((a, b) => a.remainingMs - b.remainingMs);
}

/** Milliseconds remaining until a given ISO timestamp, computed fresh. */
export function remainingMsFor(dueAt: string, now: Date = new Date()): number {
  return new Date(dueAt).getTime() - now.getTime();
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Due now";
  const days = Math.floor(ms / MILLISECONDS_PER_DAY);
  const hours = Math.floor((ms % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((ms % MILLISECONDS_PER_HOUR) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function typeLabel(type: AssessmentType): string {
  return {
    exam: "Exam",
    test: "Test",
    assignment: "Assignment",
  }[type];
}

export function typeColour(type: AssessmentType): string {
  return {
    exam: "bg-red/10 border-red/20 text-red",
    test: "bg-amber/10 border-amber/20 text-amber",
    assignment: "bg-blue/10 border-blue/20 text-blue",
  }[type];
}
