import "server-only";

import webpush from "web-push";
import { rest } from "@/lib/rest";
import { ACADEMIC_CALENDAR_EVENTS } from "@/lib/calendar";
import { COURSES } from "@/lib/resources";
import { SCHEDULE } from "@/lib/schedule";
import { addDays, dayOf, lagosDay, lagosInstant } from "@/lib/session-dates";
import {
  KINDS,
  KIND_HELP,
  KIND_LABEL,
  type NotificationKind,
} from "@/lib/notification-kinds";

export {
  KINDS,
  KIND_HELP,
  KIND_LABEL,
  type NotificationKind,
} from "@/lib/notification-kinds";
/**
 * Notifications.
 *
 * Most of what this site would want to tell somebody has already happened,
 * in a table the site already keeps. A new file is a row in `files` with a
 * timestamp on it. A mark that changed is a row in `attendance_log`. The
 * timetable is a constant. So the notification system is not a queue and a
 * delivery pipeline: it is a question asked of the data the site already
 * holds, "what has changed since this person last looked", and for the cases
 * where the answer has to reach somebody who is not looking, a web push.
 *
 * The pushes are the only part with machinery in it, and they are
 * deliberately small: a subscription is a device, and a device says nothing
 * about who is holding it.
 */

export interface Update {
  /** Unique. The same thing is never delivered twice. */
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  /** Where it goes when it is clicked. */
  href?: string;
  course?: string;
  /** The announcement this is, when it is one. */
  announcementId?: string;
  /** Whether the reader is asked to say they have seen it. */
  needsAck?: boolean;
}

export interface Prefs {
  deviceId: string;
  /** Empty means all of them. */
  kinds: NotificationKind[];
  /** Empty means all of them. */
  courses: string[];
  quietFrom: string;
  quietTo: string;
  tz: string;
}

export interface Subscription {
  id: string;
  device_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  last_seen_at: string;
}

/* ----------------------------------------------------------------- prefs */

const DEFAULT_PREFS: Omit<Prefs, "deviceId"> = {
  kinds: [],
  courses: [],
  quietFrom: "22:00",
  quietTo: "06:00",
  tz: "Africa/Lagos",
};

export async function getPrefs(deviceId: string): Promise<Prefs> {
  const rows = await rest<
    {
      device_id: string;
      kinds: string[];
      courses: string[];
      quiet_from: string;
      quiet_to: string;
      tz: string;
    }[]
  >(`notification_prefs?device_id=eq.${encodeURIComponent(deviceId)}&select=*&limit=1`);

  const row = rows?.[0];
  if (!row) return { deviceId, ...DEFAULT_PREFS };

  return {
    deviceId,
    kinds: (row.kinds ?? []) as NotificationKind[],
    courses: row.courses ?? [],
    quietFrom: row.quiet_from,
    quietTo: row.quiet_to,
    tz: row.tz,
  };
}

export async function setPrefs(
  deviceId: string,
  prefs: Partial<Omit<Prefs, "deviceId">>
): Promise<Prefs> {
  const body = {
    device_id: deviceId,
    kinds: prefs.kinds ?? DEFAULT_PREFS.kinds,
    courses: prefs.courses ?? DEFAULT_PREFS.courses,
    quiet_from: prefs.quietFrom ?? DEFAULT_PREFS.quietFrom,
    quiet_to: prefs.quietTo ?? DEFAULT_PREFS.quietTo,
    tz: prefs.tz ?? DEFAULT_PREFS.tz,
    updated_at: new Date().toISOString(),
  };

  await rest("notification_prefs?on_conflict=device_id", {
    method: "POST",
    body,
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  return { deviceId, ...prefs, ...body } as unknown as Prefs;
}

/* --------------------------------------------------------- subscriptions */

export async function listSubscriptions(): Promise<Subscription[]> {
  const rows = await rest<Subscription[]>("push_subscriptions?select=*");
  return rows ?? [];
}

export async function addSubscription(args: {
  deviceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<void> {
  await rest("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    body: {
      device_id: args.deviceId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      user_agent: args.userAgent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await rest(
    `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: "DELETE" }
  );
}

export async function touchSubscription(endpoint: string): Promise<void> {
  await rest(
    `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: "PATCH", body: { last_seen_at: new Date().toISOString() } }
  );
}

/* ------------------------------------------------------------- sent log */

export async function hasBeenSent(dedupeKey: string): Promise<boolean> {
  const rows = await rest<{ id: number }[]>(
    `notifications_sent?dedupe_key=eq.${encodeURIComponent(dedupeKey)}&select=id&limit=1`
  );
  return (rows?.length ?? 0) > 0;
}

export async function markSent(update: Update): Promise<void> {
  await rest("notifications_sent", {
    method: "POST",
    body: {
      dedupe_key: update.id,
      kind: update.kind,
      title: update.title,
      body: update.body,
      course: update.course ?? null,
    },
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
}

/* ---------------------------------------------------------- quiet hours */

function minutesOf(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** The clock in a given timezone, as minutes past midnight. */
function localMinutes(date: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

/**
 * Whether a device is asleep.
 *
 * The hours are the reader's own, so the comparison is made in the device's
 * timezone rather than the server's. Quiet hours that run past midnight are
 * handled: an evening of 22:00 to 06:00 is two ranges, not one.
 */
export function inQuietHours(prefs: Prefs, at: Date = new Date()): boolean {
  const from = minutesOf(prefs.quietFrom);
  const to = minutesOf(prefs.quietTo);
  if (from === to) return false;

  const now = localMinutes(at, prefs.tz);
  return from < to ? now >= from && now < to : now >= from || now < to;
}

/* --------------------------------------------------------------- sending */

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

export function pushIsConfigured(): boolean {
  return Boolean(
    process.env.VAPID_SUBJECT &&
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  );
}

/** The public key the browser needs, or null if push is not set up. */
export function publicVapidKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/**
 * Send one push.
 *
 * A subscription that the push service has thrown away comes back as 404 or
 * 410, and the row is deleted rather than retried forever.
 */
async function sendOne(
  subscription: Subscription,
  update: Update
): Promise<"sent" | "gone" | "failed"> {
  if (!ensureVapid()) return "failed";

  const payload = JSON.stringify({
    id: update.id,
    kind: update.kind,
    title: update.title,
    body: update.body,
    href: update.href,
    at: update.at,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
      { TTL: 60 * 60 * 6 }
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) return "gone";
    return "failed";
  }
}

/**
 * Send a push to everybody who wants it.
 *
 * The filters are the reader's own: the kinds they turned on, the courses
 * they care about, and whether it is the middle of the night where they are.
 */
/**
 * Send one push to one device.
 *
 * The preferences and the quiet hours are not consulted, because this is the
 * button that checks the whole thing works. A test that does not arrive
 * because the reader is in their quiet hours, or has turned that kind of
 * notification off, is a test that says nothing.
 */
export async function sendToDevice(
  deviceId: string,
  update: Update
): Promise<"sent" | "not-found" | "failed"> {
  if (!pushIsConfigured()) return "failed";

  const rows = await rest<Subscription[]>(
    `push_subscriptions?device_id=eq.${encodeURIComponent(
      deviceId
    )}&select=*`
  );
  const subscription = rows?.[0];
  if (!subscription) return "not-found";

  const result = await sendOne(subscription, update);
  if (result === "gone") {
    await removeSubscription(subscription.endpoint);
    return "not-found";
  }
  return result === "sent" ? "sent" : "failed";
}

export async function broadcast(
  update: Update,
  options: {
    kind?: NotificationKind;
    course?: string;
    /**
     * Whether the quiet hours are ignored.
     *
     * A quiet hour is a request not to be interrupted, and a class that is
     * not running at nine in the morning is worth waking somebody up for.
     * Urgent is the one thing that overrides it, and it overrides nothing
     * else: a reader who has turned a kind off does not get that kind
     * either, because being muted is their decision and not a mistake.
     */
    urgent?: boolean;
  } = {}
): Promise<{
  sent: number;
  skipped: number;
  gone: number;
  /** The push service refused it. */
  failed: number;
}> {
  if (!pushIsConfigured()) return { sent: 0, skipped: 0, gone: 0, failed: 0 };

  const subscriptions = await listSubscriptions();
  if (subscriptions.length === 0) {
    return { sent: 0, skipped: 0, gone: 0, failed: 0 };
  }

  const devices = new Map<string, Subscription>();
  for (const s of subscriptions) devices.set(s.device_id, s);

  let sent = 0;
  let skipped = 0;
  let gone = 0;
  let failed = 0;

  for (const [deviceId, subscription] of devices) {
    const prefs = await getPrefs(deviceId);

    if (prefs.kinds.length > 0 && !prefs.kinds.includes(update.kind)) {
      skipped += 1;
      continue;
    }
    if (
      prefs.courses.length > 0 &&
      update.course &&
      !prefs.courses.includes(update.course)
    ) {
      skipped += 1;
      continue;
    }
    if (!options.urgent && inQuietHours(prefs)) {
      skipped += 1;
      continue;
    }

    const result = await sendOne(subscription, update);
    if (result === "sent") sent += 1;
    else if (result === "gone") {
      gone += 1;
      await removeSubscription(subscription.endpoint);
    } else {
      failed += 1;
    }
  }

  if (sent > 0) await markSent(update);

  return { sent, skipped, gone, failed };
}

/* ---------------------------------------------------------- what changed */

/**
 * What has changed since a moment.
 *
 * This is the in-app half of the system, and it is the same question the
 * push half asks, asked of the same tables.
 */
export async function changesSince(
  since: Date,
  options: { course?: string; staff?: boolean } = {}
): Promise<Update[]> {
  const out: Update[] = [];
  const stamp = since.toISOString();

  // New or changed course material.
  const files = await rest<
    {
      id: string;
      course: string;
      title: string;
      type: string;
      uploaded_at: string;
      source: string;
    }[]
  >(`files?uploaded_at=gte.${stamp}&select=id,course,title,type,uploaded_at,source&order=uploaded_at.desc&limit=50`);

  for (const f of files) {
    if (options.course && f.course !== options.course) continue;
    out.push({
      id: `file:${f.id}:${f.uploaded_at}`,
      kind: "material",
      title:
        f.source === "upload"
          ? `New material for ${f.course}`
          : `Material updated for ${f.course}`,
      body: f.title,
      at: f.uploaded_at,
      href: `/courses/${courseSlug(f.course)}`,
      course: f.course,
    });
  }

  // Attendance that was recorded.
  const marks = await rest<
    {
      course: string;
      session_date: string;
      matric: string;
      marked_at: string;
      marked_by: string | null;
    }[]
  >(`attendance?marked_at=gte.${stamp}&select=*&order=marked_at.desc&limit=100`);

  for (const m of marks) {
    if (options.course && m.course !== options.course) continue;
    out.push({
      id: `mark:${m.course}:${m.session_date}:${m.matric}:${m.marked_at}`,
      kind: "attendance",
      title: `Attendance recorded for ${m.course}`,
      body: `${m.session_date}${m.marked_by ? ` · by ${m.marked_by}` : ""}`,
      at: m.marked_at,
      href: "/admin/attendance",
      course: m.course,
    });
  }

  // Corrections.
  const changes = await rest<
    {
      course: string;
      session_date: string;
      matric: string;
      changed_at: string;
      changed_by: string | null;
      old_fill: number | null;
      new_fill: number | null;
      old_excused: boolean;
      new_excused: boolean;
    }[]
  >(`attendance_log?changed_at=gte.${stamp}&select=*&order=changed_at.desc&limit=100`);

  for (const c of changes) {
    if (options.course && c.course !== options.course) continue;
    out.push({
      id: `change:${c.course}:${c.session_date}:${c.matric}:${c.changed_at}`,
      kind: "attendance",
      title: `A mark was changed for ${c.course}`,
      body: `${c.session_date}${c.changed_by ? ` · by ${c.changed_by}` : ""}`,
      at: c.changed_at,
      href: "/admin/attendance",
      course: c.course,
    });
  }

  // The messages a super admin has sent.
  //
  // A push is for the student who has the site closed. The one with the
  // site open should see the same thing in the bell, or the message only
  // reaches the people who happened not to be looking.
  const announcements = await rest<
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
    `announcements?status=eq.sent&created_at=gte.${stamp}&select=id,title,body,kind,course,href,needs_ack,created_at&order=created_at.desc&limit=20`
  );

  for (const a of announcements ?? []) {
    if (options.course && a.course && a.course !== options.course) continue;
    out.push({
      id: `announcement:${a.id}`,
      kind: (a.kind as NotificationKind) ?? "system",
      title: a.title,
      body: a.body,
      at: a.created_at,
      href: a.href ?? "/",
      course: a.course ?? undefined,
      announcementId: a.id,
      needsAck: a.needs_ack,
    });
  }

  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** The calendar, for the next fortnight. */
export function upcomingCalendar(days = 14): Update[] {
  const now = Date.now();
  const until = now + days * 86400000;

  return ACADEMIC_CALENDAR_EVENTS.filter((e) => {
    if (!e.start) return false;
    const t = e.start.getTime();
    return t >= now - 86400000 && t <= until;
  })
    .map((e) => {
      const d = e.start as Date;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        id: `calendar:${date}:${e.activity}`,
        kind: "calendar" as const,
        title: e.activity,
        body: `${e.day} ${d.getDate()} ${d.toLocaleString("en-GB", { month: "long" })} · ${e.category}`,
        at: d.toISOString(),
        href: "/timeline",
      };
    })
    .sort((a, b) => (a.at < b.at ? -1 : 1));
}

/* ------------------------------------------------------------ the classes */

export interface ClassSlot {
  course: string;
  title: string;
  /** Epoch milliseconds. */
  start: number;
  end: number;
  day: string;
  dayIndex: number;
  venue: string;
  lecturer: string;
  /** Minutes from midnight, so the breaks in it can be worked out. */
  startMin: number;
  endMin: number;
}

/**
 * The classes in a window, as real times.
 *
 * The timetable is a weekly pattern, so a class in a given week is the pattern
 * applied to that week's date. The times are built in Lagos terms, because the
 * manifest's times are wall-clock times in Lagos and the server runs in UTC.
 */
export function classesInWindow(
  from: Date,
  to: Date
): ClassSlot[] {
  const out: ClassSlot[] = [];

  // Walk the calendar days in Lagos terms, because that is the day the
  // class happens on for the people attending it.
  let iso = lagosDay(from);
  const last = lagosDay(to);

  while (iso <= last) {
    const day = dayOf(iso);
    for (const c of SCHEDULE.filter((s) => s.dayIndex === day)) {
      const start = lagosInstant(iso, c.startMin);
      const end = lagosInstant(iso, c.endMin);
      if (start < from || start > to) continue;
      out.push({
        course: c.code,
        title: c.title,
        start: start.getTime(),
        end: end.getTime(),
        day: c.dayName,
        dayIndex: day,
        venue: c.venue,
        lecturer: c.lecturer,
        startMin: c.startMin,
        endMin: c.endMin,
      });
    }
    iso = addDays(iso, 1);
  }

  return out.sort((a, b) => a.start - b.start);
}

/** The slug of a course code, for a link. */
export function courseSlug(code: string): string {
  return COURSES.find((c) => c.code === code)?.slug ?? "";
}
