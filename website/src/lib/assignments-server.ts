import "server-only";

import { rest } from "@/lib/rest";
import type {
  Assignment,
  AssignmentResource,
  AssignmentReminder,
} from "@/lib/assignments";

export interface CreateAssignmentArgs {
  courseCode: string;
  courseTitle: string;
  title: string;
  type: "group" | "individual";
  dueAt: string; // ISO string
  submitMethod: "email" | "presentation" | "inperson" | "other";
  submitDetail: string;
  notes: string;
  eventTitle: string;
  eventAt: string | null;
  notificationFrequency: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  customReminderHours: number | null;
  resources: { type: "youtube" | "upload"; url: string; title: string }[];
  reminders: { offset_hours: number }[];
}

export interface UpdateAssignmentArgs {
  title?: string;
  type?: "group" | "individual";
  dueAt?: string;
  submitMethod?: "email" | "presentation" | "inperson" | "other";
  submitDetail?: string;
  notes?: string;
  eventTitle?: string;
  eventAt?: string | null;
  notificationFrequency?: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  customReminderHours?: number | null;
  resources?: { type: "youtube" | "upload"; url: string; title: string }[] | null;
  reminders?: { offset_hours: number }[] | null;
  done?: boolean;
}

/* --------------------------------------------------------------- reading */

/**
 * Attach each assignment's resources and reminders to it.
 *
 * One batched query per child table, grouped in memory. The alternative —
 * a query per assignment per child table — turns a page of a hundred
 * assignments into two hundred round trips. The client renders
 * `resources.length` unguarded, so the arrays must always exist.
 */
async function hydrate(rows: Assignment[]): Promise<Assignment[]> {
  if (rows.length === 0) return rows;

  const ids = rows
    .map((r) => r.id.replace(/[^0-9a-fA-F-]/g, ""))
    .filter(Boolean)
    .join(",");
  if (!ids) {
    return rows.map((r) => ({ ...r, resources: [], reminders: [] }));
  }

  const [resources, reminders] = await Promise.all([
    rest<AssignmentResource[]>(
      `course_assignment_resources?assignment_id=in.(${ids})&select=*&order=title.asc`
    ),
    rest<AssignmentReminder[]>(
      `course_assignment_reminders?assignment_id=in.(${ids})&select=*&order=offset_hours.asc`
    ),
  ]);

  const byAssignment = new Map<
    string,
    { resources: AssignmentResource[]; reminders: AssignmentReminder[] }
  >();
  for (const row of rows) {
    if (row.id) byAssignment.set(row.id, { resources: [], reminders: [] });
  }
  for (const res of resources ?? [])
    if (res.assignment_id) byAssignment.get(res.assignment_id)?.resources.push(res);
  for (const rem of reminders ?? [])
    if (rem.assignment_id) byAssignment.get(rem.assignment_id)?.reminders.push(rem);

  return rows.map((row) => ({ ...row, ...byAssignment.get(row.id)! }));
}

export async function getAssignments(): Promise<Assignment[]> {
  const rows = await rest<Assignment[]>(
    "course_assignments?select=*&order=due_at.asc"
  );
  return hydrate(rows ?? []);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const rows = await rest<Assignment[]>(
    `course_assignments?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  const hydrated = await hydrate(rows ?? []);
  return hydrated[0] ?? null;
}

export async function getAssignmentResources(
  assignmentId: string
): Promise<AssignmentResource[]> {
  const rows = await rest<AssignmentResource[]>(
    `course_assignment_resources?assignment_id=eq.${encodeURIComponent(assignmentId)}&select=*&order=title.asc`
  );
  return rows ?? [];
}

export async function getAssignmentReminders(
  assignmentId: string
): Promise<AssignmentReminder[]> {
  const rows = await rest<AssignmentReminder[]>(
    `course_assignment_reminders?assignment_id=eq.${encodeURIComponent(assignmentId)}&select=*&order=offset_hours.asc`
  );
  return rows ?? [];
}

/* -------------------------------------------------------------- writing */

export async function createAssignment(args: CreateAssignmentArgs) {
  const row = {
    course_code: args.courseCode,
    course_title: args.courseTitle,
    title: args.title,
    type: args.type,
    due_at: args.dueAt,
    submit_method: args.submitMethod,
    submit_detail: args.submitDetail,
    notes: args.notes,
    event_title: args.eventTitle,
    event_at: args.eventAt,
    notification_frequency: args.notificationFrequency,
    custom_reminder_hours: args.customReminderHours,
    done: false,
  };

  const created = await rest<Assignment[]>("course_assignments", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });

  const assignment = created[0] as Assignment;

  // Resources.
  if (args.resources.length > 0) {
    await rest("course_assignment_resources", {
      method: "POST",
      body: args.resources.map((r) => ({
        assignment_id: assignment.id,
        type: r.type,
        url: r.url,
        title: r.title,
      })),
      prefer: "return=minimal",
    });
  }

  // Reminders.
  if (args.reminders.length > 0) {
    await rest("course_assignment_reminders", {
      method: "POST",
      body: args.reminders.map((r) => ({
        assignment_id: assignment.id,
        offset_hours: r.offset_hours,
      })),
      prefer: "return=minimal",
    });
  }

  return assignment;
}

export async function updateAssignment(id: string, args: UpdateAssignmentArgs) {
  const body: Record<string, unknown> = {};
  if (args.title !== undefined) body.title = args.title;
  if (args.type !== undefined) body.type = args.type;
  if (args.dueAt !== undefined) body.due_at = args.dueAt;
  if (args.submitMethod !== undefined) body.submit_method = args.submitMethod;
  if (args.submitDetail !== undefined) body.submit_detail = args.submitDetail;
  if (args.notes !== undefined) body.notes = args.notes;
  if (args.eventTitle !== undefined) body.event_title = args.eventTitle;
  if (args.eventAt !== undefined) body.event_at = args.eventAt;
  if (args.notificationFrequency !== undefined)
    body.notification_frequency = args.notificationFrequency;
  if (args.customReminderHours !== undefined)
    body.custom_reminder_hours = args.customReminderHours;
  if (args.done !== undefined) body.done = args.done;
  if (Object.keys(body).length > 0) {
    body.updated_at = new Date().toISOString();
    await rest(`course_assignments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
  }

  // Replace resources when supplied.
  if (args.resources !== undefined) {
    await rest(
      `course_assignment_resources?assignment_id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (args.resources && args.resources.length > 0) {
      await rest("course_assignment_resources", {
        method: "POST",
        body: args.resources.map((r) => ({
          assignment_id: id,
          type: r.type,
          url: r.url,
          title: r.title,
        })),
        prefer: "return=minimal",
      });
    }
  }

  // Replace reminders when supplied.
  if (args.reminders !== undefined) {
    await rest(
      `course_assignment_reminders?assignment_id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (args.reminders && args.reminders.length > 0) {
      await rest("course_assignment_reminders", {
        method: "POST",
        body: args.reminders.map((r) => ({
          assignment_id: id,
          offset_hours: r.offset_hours,
        })),
        prefer: "return=minimal",
      });
    }
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  // Deleting the assignment cascades to resources and reminders via the FK.
  await rest(`course_assignments?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Mark an assignment as done, or back to pending. */
export async function markAssignmentDone(
  id: string,
  done: boolean
): Promise<void> {
  await rest(`course_assignments?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { done },
  });
}

/** Generate (or regenerate) a share token for an assignment, returning the public URL. */
export async function generateShareToken(id: string): Promise<string> {
  const token = crypto.randomUUID();
  await rest(`course_assignments?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { share_token: token },
  });
  return `${window.location.origin}/assignments/${id}?share=${token}`;
}

/** Get an assignment by its share token (public access). */
export async function getAssignmentByShareToken(
  token: string
): Promise<Assignment | null> {
  const rows = await rest<Assignment[]>(
    `course_assignments?share_token=eq.${encodeURIComponent(token)}&select=*&limit=1`
  );
  const hydrated = await hydrate(rows ?? []);
  return hydrated[0] ?? null;
}
