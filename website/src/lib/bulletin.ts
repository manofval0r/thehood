import "server-only";

import { rest } from "@/lib/rest";
import { ACADEMIC_CALENDAR_EVENTS } from "@/lib/calendar";
import { classesInWindow } from "@/lib/notifications";
import { lagosDay } from "@/lib/session-dates";
import { COURSES } from "@/lib/resources";
import { assembleBulletinFeed } from "@/lib/bulletin-feed";
import type {
  AssessmentFeedInput,
  BulletinFeed,
  BulletinRsvpInput,
  InternalBulletinItem,
} from "@/lib/bulletin-feed";
import type {
  BulletinItem,
  ClassOccurrenceOverride,
  OutlookEvent,
  RsvpResponse,
  RsvpSummary,
} from "@/lib/bulletin-types";
import { effectiveOccurrence, rsvpCounts } from "@/lib/bulletin-domain";
import type { VerifiedStudent } from "@/lib/student-session";

interface BulletinRow {
  id: string;
  kind: BulletinItem["kind"];
  source: BulletinItem["source"];
  status: BulletinItem["status"];
  title: string;
  body: string;
  course: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  meeting_url: string | null;
  pinned: boolean;
  urgent: boolean;
  rsvp_enabled: boolean;
  expires_at: string | null;
  published_at: string | null;
  source_updated_at: string | null;
}

interface OutlookRow {
  id: string;
  external_id: string;
  subject: string;
  body_preview: string;
  course: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  join_url: string | null;
  web_url: string | null;
  is_cancelled: boolean;
  source_updated_at: string;
}

interface OverrideRow {
  id: string;
  occurrence_key: string;
  source_event_id: string | null;
  course: string;
  action: "cancel" | "change";
  status: "active" | "restored";
  original: ClassOccurrenceOverride["original"];
  proposed: ClassOccurrenceOverride["proposed"];
  reason: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  restored_at: string | null;
}

function adminItem(row: BulletinRow): InternalBulletinItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    kind: row.kind,
    source: row.source,
    status: row.status,
    course: row.course,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    hasMeeting: Boolean(row.meeting_url),
    meetingUrl: row.meeting_url,
    pinned: row.pinned,
    urgent: row.urgent,
    rsvpEnabled: row.rsvp_enabled,
    expiresAt: row.expires_at,
    publishedAt: row.published_at,
    sourceUpdatedAt: row.source_updated_at,
    sourceLabel: "Staff bulletin",
    canonicalHref: `/#bulletin-${encodeURIComponent(row.id)}`,
  };
}

function outlookEvent(row: OutlookRow): OutlookEvent {
  return {
    id: row.id,
    externalId: row.external_id,
    subject: row.subject,
    bodyPreview: row.body_preview,
    course: row.course,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    joinUrl: row.join_url,
    webUrl: row.web_url,
    isCancelled: row.is_cancelled,
    sourceUpdatedAt: row.source_updated_at,
  };
}

function occurrenceOverride(row: OverrideRow): ClassOccurrenceOverride {
  return {
    id: row.id,
    occurrenceKey: row.occurrence_key,
    sourceEventId: row.source_event_id,
    course: row.course,
    action: row.action,
    status: row.status,
    original: row.original,
    proposed: row.proposed,
    reason: row.reason,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    restoredAt: row.restored_at,
  };
}

async function safeRows<T>(query: string): Promise<T[]> {
  try {
    return (await rest<T[]>(query)) ?? [];
  } catch {
    return [];
  }
}

function timetableItems(now: Date): BulletinItem[] {
  const slots = classesInWindow(
    new Date(now.getTime() - 2 * 60 * 60 * 1000),
    new Date(now.getTime() + 14 * 86400000)
  );
  return slots.map((slot) => ({
    id: `timetable:${slot.course}:${slot.start}`,
    title: slot.title,
    body: `${slot.course} · ${slot.venue}`,
    kind: "class",
    source: "timetable",
    status: "published",
    course: slot.course,
    startsAt: new Date(slot.start).toISOString(),
    endsAt: new Date(slot.end).toISOString(),
    location: slot.venue,
    hasMeeting: false,
    pinned: false,
    urgent: false,
    rsvpEnabled: false,
    expiresAt: new Date(slot.end + 6 * 60 * 60 * 1000).toISOString(),
    publishedAt: null,
    sourceUpdatedAt: null,
    sourceLabel: "Published timetable",
    canonicalHref: `/#bulletin-timetable:${slot.course}:${slot.start}`,
  }));
}

function academicItems(now: Date): BulletinItem[] {
  const from = now.getTime() - 86400000;
  const to = now.getTime() + 45 * 86400000;
  return ACADEMIC_CALENDAR_EVENTS.filter(
    (event) =>
      event.start &&
      event.start.getTime() >= from &&
      event.start.getTime() <= to
  ).map((event) => {
    const startsAt = event.start as Date;
    const endsAt = event.end ?? startsAt;
    const id = `academic:${event.iso}:${event.activity}`;
    return {
      id,
      title: event.activity,
      body: `${event.day} · ${event.category}`,
      kind: "event" as const,
      source: "academic_calendar" as const,
      status: "published" as const,
      course: null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: null,
      hasMeeting: false,
      pinned: false,
      urgent: false,
      rsvpEnabled: false,
      expiresAt: new Date(endsAt.getTime() + 86400000).toISOString(),
      publishedAt: startsAt.toISOString(),
      sourceUpdatedAt: null,
      sourceLabel: "Academic calendar",
      canonicalHref: `/#bulletin-${encodeURIComponent(id)}`,
    };
  });
}

async function outlookHealth() {
  const rows = await safeRows<{
    sync_status: "pending" | "ok" | "error";
    synced_at: string | null;
  }>("calendar_connections?provider=eq.outlook&select=sync_status,synced_at&limit=1");
  const row = rows[0];
  if (!row) return { status: "not_configured" as const, lastSyncedAt: null };
  if (row.sync_status === "error") {
    return { status: "error" as const, lastSyncedAt: row.synced_at };
  }
  const stale = !row.synced_at || Date.now() - Date.parse(row.synced_at) > 30 * 60 * 1000;
  return {
    status: stale ? ("stale" as const) : ("ok" as const),
    lastSyncedAt: row.synced_at,
  };
}

export async function getBulletinFeed(options: {
  archive?: boolean;
  student?: VerifiedStudent | null;
  now?: Date;
} = {}): Promise<BulletinFeed> {
  const now = options.now ?? new Date();
  const from = new Date(now.getTime() - 14 * 86400000).toISOString();
  const to = new Date(now.getTime() + 60 * 86400000).toISOString();

  const [admin, outlook, overrides, rsvps, assessments, health] =
    await Promise.all([
      safeRows<BulletinRow>(
        "bulletin_items?select=*&order=pinned.desc,starts_at.asc,published_at.desc"
      ),
      safeRows<OutlookRow>(
        `outlook_events?starts_at=gte.${encodeURIComponent(
          from
        )}&starts_at=lte.${encodeURIComponent(to)}&select=*&order=starts_at`
      ),
      safeRows<OverrideRow>(
        "class_occurrence_overrides?select=*&order=updated_at.desc"
      ),
      safeRows<{ bulletin_id: string; matric: string; response: RsvpResponse }>(
        "bulletin_rsvps?select=bulletin_id,matric,response"
      ),
      options.student
        ? safeRows<{
            id: string;
            title: string;
            type: "exam" | "test" | "assignment";
            course_code: string;
            due_at: string;
            student_id: string;
          }>(
            `assessments?student_id=eq.${encodeURIComponent(
              options.student.matric
            )}&select=id,title,type,course_code,due_at,student_id`
          )
        : Promise.resolve([]),
      outlookHealth(),
    ]);

  return assembleBulletinFeed({
    now: now.getTime(),
    archive: options.archive ?? false,
    adminItems: admin.map(adminItem),
    outlookEvents: outlook.map(outlookEvent),
    overrides: overrides.map(occurrenceOverride),
    timetableItems: timetableItems(now),
    academicItems: academicItems(now),
    assessments: assessments.map(
      (row): AssessmentFeedInput => ({
        id: row.id,
        title: row.title,
        type: row.type,
        courseCode: row.course_code,
        dueAt: row.due_at,
        studentId: row.student_id,
      })
    ),
    rsvps: rsvps.map(
      (row): BulletinRsvpInput => ({
        bulletinId: row.bulletin_id,
        matric: row.matric,
        response: row.response,
      })
    ),
    studentMatric: options.student?.matric ?? null,
    outlookHealth: health,
  });
}

export async function getBulletinMeeting(id: string): Promise<{
  title: string;
  url: string;
  startsAt: string | null;
} | null> {
  if (id.startsWith("outlook:")) {
    const externalId = id.slice("outlook:".length);
    const events = await safeRows<OutlookRow>(
      `outlook_events?external_id=eq.${encodeURIComponent(
        externalId
      )}&select=*&limit=1`
    );
    const event = events[0];
    if (!event) return null;
    const overrides = await safeRows<OverrideRow>(
      `class_occurrence_overrides?source_event_id=eq.${encodeURIComponent(
        externalId
      )}&status=eq.active&select=*&order=updated_at.desc&limit=1`
    );
    const occurrence = effectiveOccurrence(
      outlookEvent(event),
      overrides[0] ? occurrenceOverride(overrides[0]) : null
    );
    if (!occurrence || occurrence.status === "cancelled" || !occurrence.meetingUrl) {
      return null;
    }
    return {
      title: occurrence.title,
      url: occurrence.meetingUrl,
      startsAt: occurrence.startsAt,
    };
  }

  const rows = await safeRows<BulletinRow>(
    `bulletin_items?id=eq.${encodeURIComponent(
      id
    )}&status=eq.published&select=*&limit=1`
  );
  const row = rows[0];
  if (!row?.meeting_url) return null;
  return { title: row.title, url: row.meeting_url, startsAt: row.starts_at };
}

export async function upsertBulletinRsvp(
  bulletinId: string,
  matric: string,
  response: RsvpResponse
): Promise<void> {
  const items = await safeRows<{ id: string; rsvp_enabled: boolean; status: string }>(
    `bulletin_items?id=eq.${encodeURIComponent(
      bulletinId
    )}&select=id,rsvp_enabled,status&limit=1`
  );
  const item = items[0];
  if (!item || !item.rsvp_enabled || item.status !== "published") {
    throw new Error("This event is not accepting responses.");
  }

  await rest("bulletin_rsvps?on_conflict=bulletin_id,matric", {
    method: "POST",
    body: {
      bulletin_id: bulletinId,
      matric,
      response,
      responded_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function getBulletinRsvpSummary(
  bulletinId: string,
  studentMatric?: string | null
): Promise<RsvpSummary> {
  const rows = await safeRows<{ matric: string; response: RsvpResponse }>(
    `bulletin_rsvps?bulletin_id=eq.${encodeURIComponent(
      bulletinId
    )}&select=matric,response`
  );
  return {
    ...rsvpCounts(rows),
    mine: rows.find((row) => row.matric === studentMatric)?.response ?? null,
  };
}

export async function getRsvpNames(bulletinId: string) {
  const rows = await safeRows<{ matric: string; response: RsvpResponse }>(
    `bulletin_rsvps?bulletin_id=eq.${encodeURIComponent(
      bulletinId
    )}&select=matric,response`
  );
  const roster = await safeRows<{ matric: string; name: string }>(
    "roster?select=matric,name"
  );
  const names = new Map(roster.map((row) => [row.matric, row.name]));
  return rows.map((row) => ({
    matric: row.matric,
    name: names.get(row.matric) ?? "Student",
    response: row.response,
  }));
}

export function occurrenceDate(event: OutlookEvent): string {
  return lagosDay(new Date(event.startsAt));
}

export function courseName(code: string | null): string | null {
  if (!code) return null;
  return COURSES.find((course) => course.code === code)?.title ?? code;
}
