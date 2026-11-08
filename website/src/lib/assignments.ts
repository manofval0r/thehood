/**
 * Assignment types and helpers.
 *
 * Nothing here touches the database, so client components can import from
 * this file without pulling in server-only code.
 */

export type AssignmentType = "group" | "individual";
export type SubmitMethod = "email" | "presentation" | "inperson" | "other";
export type NotificationFrequency = "once" | "biweekly";

export interface AssignmentResource {
  id: string;
  /** Set server-side after the assignment is created. */
  assignment_id?: string;
  type: "youtube" | "upload";
  url: string;
  title: string;
}

export interface AssignmentReminder {
  id: string;
  assignment_id: string;
  offset_hours: number;
  sent: boolean;
  sent_at: string | null;
}

export interface Assignment {
  id: string;
  course_code: string;
  course_title: string;
  title: string;
  type: AssignmentType;
  due_at: string;
  submit_method: SubmitMethod;
  submit_detail: string;
  notes: string;
  event_title: string;
  event_at: string | null;
  notification_frequency: NotificationFrequency;
  resources: AssignmentResource[];
  reminders: AssignmentReminder[];
  done: boolean;
  created_at: string;
  updated_at: string;
}

export type UpcomingAssignment = Assignment & {
  /** Milliseconds remaining. May be negative when overdue. */
  remainingMs: number;
  /** Human readable: "in 3 days", "due today", "overdue by 2 days". */
  statusLabel: string;
  /** Urgency tier for colour. */
  urgency: "green" | "amber" | "red" | "done";
  /** Progress 0-1 based on time elapsed since a notional start. */
  progress: number;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/** Notional start: 14 days before the deadline, so a progress bar has a span. */
function notionalStart(dueAt: string): number {
  return new Date(dueAt).getTime() - 14 * MILLISECONDS_PER_DAY;
}

export function upcomingAssignments(
  assignments: Assignment[],
  now: Date = new Date()
): UpcomingAssignment[] {
  return assignments
    .map((a): UpcomingAssignment => {
      const due = new Date(a.due_at).getTime();
      const remainingMs = due - now.getTime();
      const start = notionalStart(a.due_at);
      const span = due - start;
      const elapsed = now.getTime() - start;
      const progress = span > 0 ? Math.max(0, Math.min(1, elapsed / span)) : 1;

      let statusLabel: string;
      let urgency: UpcomingAssignment["urgency"];

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

export function typeLabel(type: AssignmentType): string {
  return { group: "Group", individual: "Individual" }[type];
}

export function typeColour(type: AssignmentType): string {
  return {
    group: "bg-blue/10 border-blue/20 text-blue",
    individual: "bg-green/10 border-green/20 text-green",
  }[type];
}

export function submitMethodLabel(method: SubmitMethod): string {
  return {
    email: "Email",
    presentation: "Presentation",
    inperson: "In person",
    other: "Other",
  }[method];
}

export function notificationFrequencyLabel(f: NotificationFrequency): string {
  return { once: "Once", biweekly: "Every 2 weeks" }[f];
}
