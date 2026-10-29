import "server-only";

import {
  broadcast,
  classesInWindow,
  courseSlug,
  hasBeenSent,
  markSent,
  sendToDevice,
  type Update,
} from "@/lib/notifications";
import type { NotificationKind } from "@/lib/notification-kinds";
import { rest } from "@/lib/rest";
import { getAllBreaks } from "@/lib/break-store";
import { planClassNotifications } from "@/lib/class-reminders";
import type { ClassOccurrenceOverride } from "@/lib/bulletin-types";

/**
 * The pushes that happen because something happened.
 *
 * These need no scheduler. A file was uploaded, so the upload action says
 * so. A person is waiting for approval, so the action that added them says
 * so. The one thing that needs a clock is the class reminders, and that is
 * in the scheduler.
 */

/**
 * Tell the readers that a course has new material.
 *
 * The course is named rather than the file, because a student cares that
 * CYB 301 has something new on it, and the panel shows them which.
 */
export async function announceMaterial(args: {
  course: string;
  title: string;
  uploadedBy?: string;
}): Promise<void> {
  const update: Update = {
    id: `material:${args.course}:${args.title}:${Date.now()}`,
    kind: "material",
    title: `New material for ${args.course}`,
    body: args.title,
    at: new Date().toISOString(),
    href: `/courses/${courseSlug(args.course)}`,
    course: args.course,
  };

  await broadcast(update, { kind: "material", course: args.course });
}

/** Tell the super admins that somebody is waiting to be approved. */
export async function announceApproval(
  name: string,
  addedBy: string
): Promise<void> {
  const update: Update = {
    id: `approval:${name}:${addedBy}:${Date.now()}`,
    kind: "staff",
    title: "Somebody is waiting to be approved",
    body: `${name} was added by ${addedBy}`,
    at: new Date().toISOString(),
    href: "/admin",
  };

  await broadcast(update, { kind: "staff" });
}

/** Tell the staff that a course's attendance is not finished. */
export async function announceUnmarked(
  course: string,
  sessionDate: string
): Promise<void> {
  const update: Update = {
    id: `unmarked:${course}:${sessionDate}`,
    kind: "staff",
    title: `${course} has an unmarked class`,
    body: sessionDate,
    at: new Date().toISOString(),
    href: "/admin/attendance",
    course,
  };

  // Only once per class, and only when there is a reason to say so.
  if (await hasBeenSent(update.id)) return;
  await broadcast(update, { kind: "staff", course });
}

/* ------------------------------------------------------------ the classes */

/**
 * The class reminders.
 *
 * Two moments: a few minutes before it starts, and the moment it ends. The
 * end is the one that matters, because that is when the material for the
 * class is up.
 */
export async function announceClasses(): Promise<{ sent: number }> {
  const now = Date.now();
  const slots = classesInWindow(
    new Date(now - 6 * 3600000),
    new Date(now + 8 * 60 * 60 * 1000)
  );
  const [settings, rows] = await Promise.all([
    getAllBreaks(),
    rest<
      {
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
      }[]
    >("class_occurrence_overrides?status=eq.active&select=*").catch(() => []),
  ]);
  const overrides: ClassOccurrenceOverride[] = rows.map((row) => ({
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
  }));
  const updates = planClassNotifications({
    slots,
    overrides,
    settings,
    now,
  });

  let sent = 0;
  for (const planned of updates) {
    if (await hasBeenSent(planned.id)) continue;
    const result = await broadcast(planned, {
      kind: "classes",
      course: planned.course,
    });
    sent += result.sent;
    await markSent(planned);
  }

  return { sent };
}

/* ------------------------------------------------------------ announcements */

/**
 * Send an announcement.
 *
 * The one everybody sends is "the class is cancelled today", and the whole
 * point is that it reaches the student who has the site closed and the app
 * backgrounded, which is the student who would otherwise turn up.
 *
 * The counts come back so they can be written down. "We told them" is a
 * claim about an intention; "eighteen devices were told" is a claim about a
 * fact, and only the second one is worth being able to look at afterwards.
 */
export async function announceBroadcast(announcement: {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  course: string | null;
  href: string | null;
  urgent: boolean;
}): Promise<{ sent: number; skipped: number; gone: number; failed: number }> {
  const update: Update = {
    id: `announcement:${announcement.id}`,
    kind: announcement.kind,
    title: announcement.title,
    body: announcement.body,
    at: new Date().toISOString(),
    href: announcement.href ?? "/",
    course: announcement.course ?? undefined,
    announcementId: announcement.id,
  };

  return broadcast(update, {
    kind: announcement.kind,
    course: announcement.course ?? undefined,
    urgent: announcement.urgent,
    // A message a person wrote is not a kind anybody can mute.
    manual: true,
  });
}

/* ---------------------------------------------------------------- health */
/**
 * A test notification, to one device.
 *
 * This is the button a super admin presses to check that the push keys, the
 * service worker and the browser are all in order. It goes to the device
 * that pressed the button and nowhere else, and it ignores the quiet hours,
 * because a test that does not arrive says nothing about whether the keys
 * work.
 */
export async function announceTest(
  deviceId: string,
  by: string,
  sample?: {
    kind?: NotificationKind;
    title?: string;
    body?: string;
    href?: string;
    course?: string;
  }
): Promise<"sent" | "not-found" | "failed"> {
  const update: Update = {
    id: `test:${deviceId}:${Date.now()}`,
    kind: sample?.kind ?? "system",
    title: sample?.title ?? "The notifications are working",
    body:
      sample?.body ??
      `Sent to ${by}, to check that the push keys, the service worker and this browser are all in order.`,
    at: new Date().toISOString(),
    href: sample?.href ?? "/",
    course: sample?.course,
  };

  return sendToDevice(deviceId, update);
}
/**
 * Whether the things the site depends on are working.
 *
 * The competitions feed fails silently by design, which is right for a reader
 * and wrong for the person who runs the site, so the failure is recorded
 * where it can be told to somebody.
 */
export async function recordHealth(
  key: string,
  ok: boolean,
  detail?: string
): Promise<void> {
  await rest("system_health?on_conflict=key", {
    method: "POST",
    body: { key, ok, detail: detail ?? null, checked_at: new Date().toISOString() },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}
