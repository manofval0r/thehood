import { COURSES } from "@/lib/resources";

/**
 * Everything the public assignment API accepts, checked twice a request:
 * once in the route before touching the database, and once at the edge of
 * the client. Assignment creation is open to everyone, so the server is
 * the only place that can be trusted to enforce these rules.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const NOTES_MAX = 2000;
const EVENT_TITLE_MAX = 120;
const SUBMIT_DETAIL_MAX = 200;
const RESOURCE_URL_MAX = 500;
const RESOURCE_TITLE_MAX = 120;
const MAX_RESOURCES = 8;
const MAX_REMINDERS = 12;

export type SubmitMethod = "email" | "presentation" | "inperson" | "other";
export type NotificationFrequency =
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export interface ValidatedAssignment {
  courseCode: string;
  courseTitle: string;
  title: string;
  type: "group" | "individual";
  dueAt: string; // ISO
  submitMethod: SubmitMethod;
  submitDetail: string;
  notes: string;
  eventTitle: string;
  eventAt: string | null; // ISO
  notificationFrequency: NotificationFrequency;
  customReminderHours: number | null;
  resources: { type: "youtube" | "upload"; url: string; title: string }[];
  reminders: { offset_hours: number }[];
}

export type ValidationResult =
  | { ok: true; value: ValidatedAssignment }
  | { ok: false; error: string };

export function validateAssignmentBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;

  // The course is authoritative from the server's manifest, not the client.
  const course = COURSES.find((c) => c.code === b.courseCode);
  if (!course) {
    return { ok: false, error: "Pick a course from the list" };
  }

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { ok: false, error: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters` };
  }

  const type = b.type;
  if (type !== "group" && type !== "individual") {
    return { ok: false, error: "Type must be group or individual" };
  }

  const due = new Date(typeof b.dueAt === "string" ? b.dueAt : String(b.dueAt ?? ""));
  if (Number.isNaN(due.getTime())) {
    return { ok: false, error: "Due date must be a valid date and time" };
  }
  if (due.getTime() < Date.now() - 60_000) {
    return { ok: false, error: "Due date must be in the future" };
  }
  if (due.getTime() > Date.now() + 3 * 366 * 24 * 60 * 60 * 1000) {
    return { ok: false, error: "Due date is too far in the future" };
  }

  const method = b.submitMethod;
  if (
    method !== "email" &&
    method !== "presentation" &&
    method !== "inperson" &&
    method !== "other"
  ) {
    return { ok: false, error: "Pick a submission method" };
  }
  const submitDetail =
    typeof b.submitDetail === "string" ? b.submitDetail.trim() : "";
  if (submitDetail.length > SUBMIT_DETAIL_MAX) {
    return { ok: false, error: "Submission detail is too long" };
  }
  if (method === "email" && !EMAIL_RE.test(submitDetail)) {
    return { ok: false, error: "Use a valid email for email submissions" };
  }

  const freq = (b.notificationFrequency ?? "once") as NotificationFrequency;
  if (
    freq !== "once" &&
    freq !== "daily" &&
    freq !== "weekly" &&
    freq !== "biweekly" &&
    freq !== "monthly" &&
    freq !== "custom"
  ) {
    return { ok: false, error: "Pick a reminder frequency" };
  }
  const customReminderHours =
    b.customReminderHours == null ? null : Number(b.customReminderHours);
  if (freq === "custom") {
    if (
      !Number.isFinite(customReminderHours) ||
      (customReminderHours as number) <= 0
    ) {
      return { ok: false, error: "Custom reminder must be a positive number of hours" };
    }
  }

  const notes =
    typeof b.notes === "string" ? b.notes.slice(0, NOTES_MAX) : "";

  const eventTitle =
    typeof b.eventTitle === "string"
      ? b.eventTitle.trim().slice(0, EVENT_TITLE_MAX)
      : "";
  let eventAt: string | null = null;
  if (b.eventAt) {
    const d = new Date(String(b.eventAt));
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: "Event date must be a valid date and time" };
    }
    eventAt = d.toISOString();
  }

  // Resources.
  const resourcesRaw = Array.isArray(b.resources) ? b.resources : [];
  if (resourcesRaw.length > MAX_RESOURCES) {
    return { ok: false, error: `No more than ${MAX_RESOURCES} resources` };
  }
  const resources: ValidatedAssignment["resources"] = [];
  for (const raw of resourcesRaw) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Invalid resource" };
    }
    const r = raw as Record<string, unknown>;
    const rType = r.type;
    if (rType !== "youtube" && rType !== "upload") {
      return { ok: false, error: "Resource type must be YouTube or upload" };
    }
    const url = typeof r.url === "string" ? r.url.trim() : "";
    if (!/^https?:\/\//i.test(url) || url.length > RESOURCE_URL_MAX) {
      return { ok: false, error: "Each resource must be a valid web link" };
    }
    if (rType === "youtube" && !/(youtube\.com|youtu\.be)\//i.test(url)) {
      return { ok: false, error: "YouTube resources must link to a YouTube video" };
    }
    const titleRaw = typeof r.title === "string" ? r.title.trim() : "";
    const titleOut = titleRaw.slice(0, RESOURCE_TITLE_MAX) || url.slice(0, 60);
    resources.push({ type: rType, url, title: titleOut });
  }

  // Reminders.
  const remindersRaw = Array.isArray(b.reminders) ? b.reminders : [];
  if (remindersRaw.length > MAX_REMINDERS) {
    return { ok: false, error: `No more than ${MAX_REMINDERS} reminders` };
  }
  const reminders: ValidatedAssignment["reminders"] = [];
  for (const raw of remindersRaw) {
    const hours = Number((raw as { offset_hours?: unknown } | null)?.offset_hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 366) {
      return { ok: false, error: "Reminders must be within a year before the deadline" };
    }
    reminders.push({ offset_hours: Math.round(hours) });
  }

  return {
    ok: true,
    value: {
      courseCode: course.code,
      courseTitle: course.title,
      title,
      type,
      dueAt: due.toISOString(),
      submitMethod: method,
      submitDetail,
      notes,
      eventTitle,
      eventAt,
      notificationFrequency: freq,
      customReminderHours: freq === "custom" ? customReminderHours : null,
      resources,
      reminders,
    },
  };
}
