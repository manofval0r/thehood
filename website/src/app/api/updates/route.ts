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
import { unmarkedClassesByCourse } from "@/lib/attendance-db";
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
    /** The classes with no marks, by course. For the staff. */
    blank: Record<string, { date: string; day: string; time: string; venue: string }[]>;
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
    blank: {},
    health: null,
  };

  // The staff list, for the people who look after it.
  if (isStaffUser) {
    const [pending, blank, health] = await Promise.all([
      staffPending(),
      unmarkedClassesByCourse(),
      systemHealth(isSuperUser),
    ]);
    body.staff = {
      pending,
      incomplete: Object.values(blank).reduce((n, list) => n + list.length, 0),
    };
    body.blank = blank;
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
