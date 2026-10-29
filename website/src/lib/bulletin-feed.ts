import {
  effectiveOccurrence,
  isBulletinActive,
  rsvpCounts,
  sortBulletinItems,
} from "@/lib/bulletin-domain";
import type {
  BulletinItem,
  ClassOccurrenceOverride,
  OutlookEvent,
  RsvpResponse,
} from "@/lib/bulletin-types";

export interface InternalBulletinItem extends BulletinItem {
  meetingUrl?: string | null;
}

export interface AssessmentFeedInput {
  id: string;
  title: string;
  type: "exam" | "test" | "assignment";
  courseCode: string;
  dueAt: string;
  studentId: string;
}

export interface BulletinRsvpInput {
  bulletinId: string;
  matric: string;
  response: RsvpResponse;
}

export interface BulletinFeedInput {
  now: number;
  archive: boolean;
  adminItems: InternalBulletinItem[];
  outlookEvents: OutlookEvent[];
  overrides: ClassOccurrenceOverride[];
  timetableItems: BulletinItem[];
  academicItems: BulletinItem[];
  assessments: AssessmentFeedInput[];
  rsvps: BulletinRsvpInput[];
  studentMatric: string | null;
  outlookHealth?: {
    status: "ok" | "stale" | "error" | "not_configured";
    lastSyncedAt: string | null;
  };
}

export interface BulletinFeed {
  items: BulletinItem[];
  archive: boolean;
  generatedAt: string;
  outlookHealth: {
    status: "ok" | "stale" | "error" | "not_configured";
    lastSyncedAt: string | null;
  };
}

function canonical(id: string): string {
  return `/#bulletin-${encodeURIComponent(id)}`;
}

function redact(item: InternalBulletinItem): BulletinItem {
  const publicItem: Partial<InternalBulletinItem> = { ...item };
  delete publicItem.meetingUrl;
  return {
    ...(publicItem as BulletinItem),
    canonicalHref: canonical(item.id),
  };
}

function outlookItem(
  event: OutlookEvent,
  override: ClassOccurrenceOverride | null
): BulletinItem | null {
  const occurrence = effectiveOccurrence(event, override);
  if (!occurrence) return null;

  const cancelled = occurrence.status === "cancelled";
  const sourceLabel =
    occurrence.effectiveSource === "override"
      ? "Super-admin override"
      : "Outlook calendar";

  return {
    id: `outlook:${event.externalId}`,
    title: cancelled ? `${occurrence.title} cancelled` : occurrence.title,
    body: cancelled
      ? [occurrence.note, occurrence.reason].filter(Boolean).join(" · ") ||
        "This class will not hold."
      : occurrence.note || occurrence.body,
    kind: cancelled ? "alert" : "class",
    source: "outlook",
    status: "published",
    course: occurrence.course,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    location: occurrence.location,
    hasMeeting: !cancelled && Boolean(occurrence.meetingUrl),
    pinned: false,
    urgent: cancelled,
    rsvpEnabled: false,
    expiresAt: new Date(Date.parse(occurrence.endsAt) + 6 * 60 * 60 * 1000).toISOString(),
    publishedAt: occurrence.sourceUpdatedAt,
    sourceUpdatedAt: occurrence.sourceUpdatedAt,
    sourceLabel,
    canonicalHref: canonical(`outlook:${event.externalId}`),
  };
}

function assessmentItem(input: AssessmentFeedInput): BulletinItem | null {
  const due = Date.parse(input.dueAt);
  if (!Number.isFinite(due)) return null;
  const kindLabel =
    input.type === "exam"
      ? "Exam"
      : input.type === "test"
        ? "Test"
        : "Assignment";
  return {
    id: `assessment:${input.id}`,
    title: input.title,
    body: `${kindLabel} for ${input.courseCode}`,
    kind: "deadline",
    source: "assessment",
    status: "published",
    course: input.courseCode,
    startsAt: input.dueAt,
    endsAt: input.dueAt,
    location: null,
    hasMeeting: false,
    pinned: false,
    urgent: due - Date.now() <= 24 * 60 * 60 * 1000,
    rsvpEnabled: false,
    expiresAt: new Date(due + 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: input.dueAt,
    sourceUpdatedAt: input.dueAt,
    sourceLabel: "Your assessments",
    canonicalHref: `/assessments#${encodeURIComponent(input.id)}`,
  };
}

function occurrenceKey(item: Pick<BulletinItem, "course" | "startsAt">) {
  return item.course && item.startsAt ? `${item.course}|${item.startsAt}` : null;
}

export function assembleBulletinFeed(input: BulletinFeedInput): BulletinFeed {
  const overridesByEvent = new Map(
    input.overrides
      .filter((entry) => entry.sourceEventId)
      .map((entry) => [entry.sourceEventId as string, entry])
  );

  const outlookItems = input.outlookEvents
    .map((event) => outlookItem(event, overridesByEvent.get(event.externalId) ?? null))
    .filter((item): item is BulletinItem => Boolean(item));
  const outlookOccurrences = new Set(
    outlookItems.map(occurrenceKey).filter((key): key is string => Boolean(key))
  );

  const adminItems = input.adminItems.map(redact);
  const timetableItems = input.timetableItems.filter((item) => {
    const key = occurrenceKey(item);
    return !key || !outlookOccurrences.has(key);
  });
  const assessmentItems = input.studentMatric
    ? input.assessments
        .filter((entry) => entry.studentId === input.studentMatric)
        .map(assessmentItem)
        .filter((item): item is BulletinItem => Boolean(item))
    : [];

  const rsvpsByBulletin = new Map<string, BulletinRsvpInput[]>();
  for (const row of input.rsvps) {
    const rows = rsvpsByBulletin.get(row.bulletinId) ?? [];
    rows.push(row);
    rsvpsByBulletin.set(row.bulletinId, rows);
  }

  const merged = [
    ...adminItems,
    ...outlookItems,
    ...timetableItems,
    ...input.academicItems,
    ...assessmentItems,
  ].map((item) => {
    if (!item.rsvpEnabled) return item;
    const rows = rsvpsByBulletin.get(item.id) ?? [];
    return {
      ...item,
      rsvp: {
        ...rsvpCounts(rows),
        mine:
          rows.find((row) => row.matric === input.studentMatric)?.response ??
          null,
      },
    };
  });

  const selected = merged.filter((item) =>
    input.archive
      ? !isBulletinActive(item, input.now)
      : isBulletinActive(item, input.now)
  );

  return {
    items: sortBulletinItems(selected, input.now),
    archive: input.archive,
    generatedAt: new Date(input.now).toISOString(),
    outlookHealth: input.outlookHealth ?? {
      status: "not_configured",
      lastSyncedAt: null,
    },
  };
}
