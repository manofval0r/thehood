import { NextResponse } from "next/server";
import {
  changesSince,
  classesInWindow,
  upcomingCalendar,
  type NotificationKind,
} from "@/lib/notifications";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import { rest } from "@/lib/rest";
import { getCtfEvents } from "@/lib/events";

/**
 * What has changed.
 *
 * This is the question the whole notification system is built on, asked of
 * the data the site already keeps. The bell in the navigation asks it, and
 * so does the scheduler that decides what to push.
 *
 * The cursor is the reader's own: they say when they last looked, and the
 * answer is everything that has happened since. There is no read receipt
 * table and no per-notification row to mark as seen.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const course = url.searchParams.get("course") ?? undefined;
  const kind = url.searchParams.get("kind") as NotificationKind | null;

  const from = since ? new Date(since) : new Date(Date.now() - 7 * 86400000);
  const sinceIso = Number.isNaN(from.getTime())
    ? new Date(Date.now() - 7 * 86400000).toISOString()
    : from.toISOString();

  const staff = await currentStaff();
  const isStaffUser = Boolean(staff);
  const isSuperUser = isSuper(staff);

  const changes = await changesSince(from, { course });
  const upcoming = upcomingCalendar(14);

  const filtered = kind
    ? changes.filter((c) => c.kind === kind)
    : changes;

  const body: {
    since: string;
    updates: typeof filtered;
    upcoming: typeof upcoming;
    unread: number;
    classes: ReturnType<typeof classesInWindow>;
    staff: { pending: number; incomplete: number } | null;
    health: { news: boolean; storage: boolean } | null;
  } = {
    since: sinceIso,
    updates: filtered,
    upcoming,
    unread: filtered.length,
    // The next day's classes, so the browser can time the reminders on its
    // own. The times are known in advance and do not need a server to tell
    // the reader about them.
    classes: classesInWindow(new Date(), new Date(Date.now() + 36 * 3600000)),
    staff: null,
    health: null,
  };

  // The staff list, for the people who look after it.
  if (isStaffUser) {
    const [pending, incomplete, health] = await Promise.all([
      staffPending(),
      incompleteAttendance(),
      systemHealth(isSuperUser),
    ]);
    body.staff = { pending, incomplete };
    if (isSuperUser) body.health = health;
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** How many people are waiting to be approved. */
async function staffPending(): Promise<number> {
  const rows = await rest<{ id: string }[]>(
    "staff?status=eq.pending&select=id"
  );
  return rows?.length ?? 0;
}

/**
 * The classes whose attendance was not fully marked.
 *
 * Only the last fortnight, because a class from six weeks ago is not
 * something anybody needs to be told about today. A class counts as done
 * when at least one mark exists for it, and a course with nobody on the roll
 * is not a class that was forgotten.
 */
async function incompleteAttendance(): Promise<number> {
  const { classesInWindow } = await import("@/lib/notifications");

  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const slots = classesInWindow(
    new Date(`${since}T00:00:00Z`),
    new Date(Date.now())
  );
  if (slots.length === 0) return 0;

  const [marked, onRoll] = await Promise.all([
    rest<{ course: string; session_date: string }[]>(
      `attendance?session_date=gte.${since}&select=course,session_date`
    ),
    rest<{ course: string }[]>("roster?select=course"),
  ]);

  const markedSet = new Set(
    (marked ?? []).map((r) => `${r.course}|${r.session_date}`)
  );
  const rollSize = new Map<string, number>();
  for (const r of onRoll ?? []) {
    rollSize.set(r.course, (rollSize.get(r.course) ?? 0) + 1);
  }

  let count = 0;
  for (const slot of slots) {
    const date = new Date(slot.start).toISOString().slice(0, 10);
    if ((rollSize.get(slot.course) ?? 0) === 0) continue;
    if (!markedSet.has(`${slot.course}|${date}`)) count += 1;
  }
  return count;
}

/** Whether the things the site depends on are working. */
async function systemHealth(
  includeNews: boolean
): Promise<{ news: boolean; storage: boolean }> {
  let news = true;
  let storage = true;

  if (includeNews) {
    const events = await getCtfEvents(1);
    news = events.length > 0;
  }

  try {
    const rows = await rest<{ n: number }[]>(
      "notifications_sent?select=id&limit=1"
    );
    storage = Array.isArray(rows);
  } catch {
    storage = false;
  }

  return { news, storage };
}
