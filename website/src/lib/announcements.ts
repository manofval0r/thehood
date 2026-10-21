import "server-only";

import { rest } from "@/lib/rest";
import { classesInWindow } from "@/lib/notifications";
import { formatRange } from "@/lib/schedule";
import { describe, lagosDay, todayIso } from "@/lib/session-dates";
import { COURSES } from "@/lib/resources";
import {
  fillTemplate,
  type AnnouncementTemplate,
  type ClassContext,
  type TemplateDefinition,
  TEMPLATE_BY_ID,
} from "@/lib/announcement-templates";
import type { NotificationKind } from "@/lib/notification-kinds";

/**
 * Announcements.
 *
 * A message a super admin sends to everybody who has turned their
 * notifications on. The one everybody sends is "the class is cancelled
 * today", and the reason it is a feature rather than a button is that the
 * message has to reach the student who has the site closed and the app
 * backgrounded, which is the student who would otherwise turn up.
 *
 * The row keeps the counts. "We told them" is a claim about an intention;
 * "eighteen devices were told" is a claim about a fact, and only the
 * second one is worth being able to look at afterwards.
 */

export interface Announcement {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  /** The course it is about. Null means everybody. */
  course: string | null;
  href: string | null;
  urgent: boolean;
  needs_ack: boolean;
  status: "sent" | "scheduled" | "cancelled";
  scheduled_for: string | null;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  sent_at: string | null;
  sent_count: number;
  skipped_count: number;
  gone_count: number;
  failed_count: number;
}

/** An announcement, with what is known about it. */
export interface AnnouncementWithCounts extends Announcement {
  /** How many devices have said they have seen it. */
  acked: number;
}

/* --------------------------------------------------------------- reading */

/** The announcements, newest first. */
export async function listAnnouncements(
  limit = 30
): Promise<AnnouncementWithCounts[]> {
  const rows = await rest<Announcement[]>(
    `announcements?select=*&order=created_at.desc&limit=${limit}`
  );

  const list = rows ?? [];
  if (list.length === 0) return [];

  const acks = await rest<{ announcement_id: string }[]>(
    "announcement_acks?select=announcement_id"
  );

  const counts = new Map<string, number>();
  for (const a of acks ?? []) {
    counts.set(a.announcement_id, (counts.get(a.announcement_id) ?? 0) + 1);
  }

  return list.map((a) => ({ ...a, acked: counts.get(a.id) ?? 0 }));
}

/** One announcement. */
export async function getAnnouncement(
  id: string
): Promise<Announcement | undefined> {
  const rows = await rest<Announcement[]>(
    `announcements?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows?.[0];
}

/**
 * The announcements that are due to go out.
 *
 * The scheduler runs every five minutes, so an announcement written for
 * seven in the morning goes out at about five past.
 */
export async function listDueAnnouncements(
  now: Date = new Date()
): Promise<Announcement[]> {
  const rows = await rest<Announcement[]>(
    `announcements?status=eq.scheduled&scheduled_for=lte.${encodeURIComponent(
      now.toISOString()
    )}&select=*&order=scheduled_for&limit=20`
  );
  return rows ?? [];
}

/* --------------------------------------------------------------- writing */

/** Put a new announcement in the table. */
export async function createAnnouncement(args: {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  course: string | null;
  href: string | null;
  urgent: boolean;
  needsAck: boolean;
  status: "sent" | "scheduled";
  scheduledFor: string | null;
  by: { id: string; name: string };
}): Promise<Announcement> {
  const rows = await rest<Announcement[]>("announcements", {
    method: "POST",
    body: {
      id: args.id,
      title: args.title,
      body: args.body,
      kind: args.kind,
      course: args.course,
      href: args.href,
      urgent: args.urgent,
      needs_ack: args.needsAck,
      status: args.status,
      scheduled_for: args.scheduledFor,
      created_by: args.by.id,
      created_by_name: args.by.name,
      sent_at: args.status === "sent" ? new Date().toISOString() : null,
    },
    prefer: "return=representation",
  });

  return rows[0];
}

/** Write down how far an announcement got. */
export async function recordDelivery(
  id: string,
  counts: { sent: number; skipped: number; gone: number; failed?: number }
): Promise<void> {
  await rest(`announcements?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: counts.sent,
      skipped_count: counts.skipped,
      gone_count: counts.gone,
      failed_count: counts.failed ?? 0,
    },
  });
}

/** A scheduled announcement that will not be sent. */
export async function cancelAnnouncement(id: string): Promise<void> {
  await rest(`announcements?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status: "cancelled" },
  });
}

/* ------------------------------------------------------ the acknowledgements */

/** Say that this device has seen an announcement. */
export async function acknowledge(
  announcementId: string,
  deviceId: string
): Promise<void> {
  await rest("announcement_acks", {
    method: "POST",
    body: { announcement_id: announcementId, device_id: deviceId },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
}

/** Which announcements this device has already said it has seen. */
export async function listAcks(deviceId: string): Promise<string[]> {
  const rows = await rest<{ announcement_id: string }[]>(
    `announcement_acks?device_id=eq.${encodeURIComponent(
      deviceId
    )}&select=announcement_id`
  );
  return (rows ?? []).map((r) => r.announcement_id);
}

/**
 * The announcements that are still waiting to be confirmed.
 *
 * The bell's list is everything that has changed since the reader last
 * looked, and it moves on when they look. That is right for a new file and
 * wrong for a class that is not running: a cancellation has to stay in
 * front of the reader until they say they have seen it, or it is the same
 * as never having sent it.
 *
 * Only the ones that asked for a confirmation, and only for a fortnight,
 * because a confirmation for something three weeks old is of no use to
 * anybody.
 */
export async function listPendingAnnouncements(
  deviceId: string,
  days = 14
): Promise<
  {
    id: string;
    title: string;
    body: string;
    kind: string;
    course: string | null;
    href: string | null;
    needs_ack: boolean;
    created_at: string;
  }[]
> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const rows = await rest<
    {
      id: string;
      title: string;
      body: string;
      kind: string;
      course: string | null;
      href: string | null;
      needs_ack: boolean;
      created_at: string;
    }[]
  >(
    `announcements?status=eq.sent&needs_ack=eq.true&created_at=gte.${since}&select=id,title,body,kind,course,href,needs_ack,created_at&order=created_at.desc&limit=20`
  );

  const acked = await listAcks(deviceId);
  const seen = new Set(acked);

  return (rows ?? []).filter((a) => !seen.has(a.id));
}

/* ------------------------------------------------------ the class context */

/**
 * What the composer needs to know about a course's classes.
 *
 * The times come from the timetable, which is the same timetable the
 * countdown and the reminders read, so a message cannot say the wrong time
 * for a class: there is one timetable and this is it.
 *
 * It is the class that has not happened yet that matters. A class that
 * finished an hour ago cannot be cancelled, and a message about it would
 * be a message about the wrong class.
 */
export function classContexts(now: Date = new Date()): ClassContext[] {
  const today = todayIso(now.getTime());
  const from = new Date(now.getTime() - 12 * 3600000);
  const to = new Date(now.getTime() + 60 * 86400000);
  const slots = classesInWindow(from, to);

  const out: ClassContext[] = [];

  for (const course of COURSES) {
    const mine = slots
      .filter((s) => s.course === course.code)
      .sort((a, b) => a.start - b.start);

    // The next class that has not started yet, and the one after it.
    const first = mine.find((s) => s.start > now.getTime()) ?? null;
    const nextOne = first
      ? mine.find((s) => s.start > first.start) ?? null
      : null;

    const firstDay = first ? lagosDay(new Date(first.start)) : "";

    out.push({
      course: course.code,
      title: course.title,
      // "today", or "on Friday 23 October".
      when: first
        ? firstDay === today
          ? "today"
          : `on ${shortDate(firstDay)}`
        : "",
      time: first ? formatRangeOf(first) : "",
      venue: first ? first.venue : course.venue,
      next: nextOne
        ? `The next class is ${dayPhrase(nextOne, today)} at ${clockOf(nextOne.start)}.`
        : "",
      today: firstDay === today,
    });
  }

  return out;
}

/** The time of a class, as "12:30pm to 2:30pm". */
function formatRangeOf(slot: { start: number; end: number }): string {
  return `${clockOf(slot.start)} to ${clockOf(slot.end)}`;
}

/** "today", or "on Friday 23 October". */
function dayPhrase(slot: { start: number }, today: string): string {
  const day = lagosDay(new Date(slot.start));
  return day === today ? "today" : `on ${shortDate(day)}`;
}

/**
 * The clock of an instant, in Lagos, as "12:30pm".
 *
 * The same shape the timetable uses, so a message and the timetable beside
 * it say the same thing in the same way. Lagos is UTC+1 all year and has
 * no daylight saving, which is why the offset is a flat hour.
 */
function clockOf(start: number): string {
  const d = new Date(start);
  const minutes = (d.getUTCHours() * 60 + d.getUTCMinutes() + 60) % 1440;
  const h24 = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${h24 < 12 ? "am" : "pm"}`;
}

/** "Friday 23 October", without the year. */
function shortDate(iso: string): string {
  const d = describe(iso);
  const month = MONTH_NAMES[Number(iso.split("-")[1]) - 1];
  return `${d.weekday} ${d.day} ${month}`;
}

/** The month names, in full. */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ------------------------------------------------------------ the draft */

/**
 * The draft a super admin starts from.
 *
 * The composer asks for this rather than building the text itself, so the
 * preview and the message that is sent are made of the same words.
 */
export function draftFor(
  template: AnnouncementTemplate,
  courseCode: string | null,
  detail: string,
  contexts: ClassContext[]
): { title: string; body: string; href: string; kind: NotificationKind } {
  const definition: TemplateDefinition = TEMPLATE_BY_ID[template];
  const context = courseCode
    ? contexts.find((c) => c.course === courseCode) ?? null
    : null;

  const draft = fillTemplate(template, context, detail);
  return {
    title: draft.title,
    body: draft.body,
    href: draft.href,
    kind: definition.kind,
  };
}

export { formatRange };
