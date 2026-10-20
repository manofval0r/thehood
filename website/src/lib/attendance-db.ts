import "server-only";

import { rest } from "@/lib/rest";

/** Whether the store is reachable at all. */
export { isConfigured } from "@/lib/rest";

/**
 * The attendance store.
 *
 * The database is Supabase, reached over PostgREST with the service role key.
 * The service key is server-only: it is read from the environment here and
 * never leaves the server, so the attendance never reaches the client bundle.
 * The tables have row level security on and no policies, which means the anon
 * key cannot read them either, so the only way in is through this file.
 *
 * There is no SDK on purpose. The calls this needs are four endpoints and two
 * functions, and hand-written requests keep the dependency list short and the
 * request shape visible.
 */

export interface RosterStudent {
  matric: string;
  name: string;
  course: string;
}

export interface Mark {
  course: string;
  session_date: string;
  matric: string;
  /** 0 to 1, or null when the box has not been marked. */
  fill: number | null;
  excused: boolean;
  marked_by: string | null;
  marked_at: string | null;
}

/** Every student on the roll, for one course or for all of them. */
export async function getRoster(course?: string): Promise<RosterStudent[]> {
  const query = course
    ? `roster?course=eq.${encodeURIComponent(course)}&select=matric,name,course&order=name`
    : "roster?select=matric,name,course&order=course,name";
  const rows = await rest<RosterStudent[]>(query);
  return rows ?? [];
}

/** The marks for a course on a set of session dates, keyed by matric. */
export async function getMarks(
  course: string,
  sessionDates: string[]
): Promise<Map<string, Mark>> {
  const out = new Map<string, Mark>();
  if (sessionDates.length === 0) return out;

  // PostgREST spells a set filter as in.(a,b,c), with no operator inside.
  const dates = sessionDates.join(",");
  const rows = await rest<Mark[]>(
    `attendance?course=eq.${encodeURIComponent(course)}&session_date=in.(${dates})&select=*`
  );

  for (const row of rows ?? []) {
    out.set(`${row.session_date}|${row.matric}`, {
      ...row,
      fill: row.fill === null ? null : Number(row.fill),    });
  }
  return out;
}

/**
 * Mark one box.
 *
 * `fill` is a level, not a boolean: null means nobody has marked it, 0 means
 * absent, and anything between is partial. Excused is a separate state, not a
 * flavour of absent.
 */
export async function setMark(args: {
  course: string;
  sessionDate: string;
  matric: string;
  fill: number | null;
  excused: boolean;
  markedBy: string;
}): Promise<void> {
  await rest("rpc/set_attendance", {
    method: "POST",
    body: ({
      p_course: args.course,
      p_session_date: args.sessionDate,
      p_matric: args.matric,
      p_fill: args.fill,
      p_excused: args.excused,
      p_marked_by: args.markedBy,
    }),  });
}

/** Mark a whole column at once, for "everyone present" or "clear this class". */
export async function setMarksBulk(args: {
  course: string;
  sessionDate: string;
  matrics: string[];
  fill: number | null;
  excused: boolean;
  markedBy: string;
}): Promise<void> {
  if (args.matrics?.length === 0) return;
  await rest("rpc/set_attendance_bulk", {
    method: "POST",
    body: ({
      p_course: args.course,
      p_session_date: args.sessionDate,
      p_matric: args.matrics,
      p_fill: args.fill,
      p_excused: args.excused,
      p_marked_by: args.markedBy,
    }),  });
}

/** Put students on the roll. Existing matrics keep their name. */
export async function addStudents(
  students: { matric: string; name: string; course: string }[]
): Promise<void> {
  if (students.length === 0) return;
  await rest("roster", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: students,
  });
}

/** Take a student off the roll. Their marks stay, so the history survives. */
export async function removeStudent(matric: string): Promise<void> {
  await rest(`roster?matric=eq.${encodeURIComponent(matric)}`, {
    method: "DELETE",
  });
}

export interface Standing {
  /** Percentage of marked sessions attended, 0 to 100. */
  pct: number;
  /** Sessions that were actually marked. */
  marked: number;
  /** Sessions excused, which are not counted against anyone. */
  excused: number;
}

/**
 * How each student is doing across every session recorded for a course.
 *
 * Only sessions somebody actually marked count. A session with no entry is
 * not a session the student missed, it is a session nobody has got to, and
 * leaving it out of the denominator is what stops an unfinished week from
 * becoming a bad mark for the student.
 */
export async function getStanding(
  course: string
): Promise<Record<string, Standing>> {
  const rows = await rest<
    { matric: string; fill: number | null; excused: boolean }[]
  >(
    `attendance?course=eq.${encodeURIComponent(course)}&select=matric,fill,excused`
  );

  const sums = new Map<string, number>();
  const out: Record<string, Standing> = {};

  for (const row of rows ?? []) {
    const entry =
      out[row.matric] ??
      (out[row.matric] = { pct: 0, marked: 0, excused: 0 });

    if (row.excused) {
      entry.excused += 1;
      continue;
    }
    if (row.fill === null) continue;

    entry.marked += 1;
    sums.set(row.matric, (sums.get(row.matric) ?? 0) + Number(row.fill));
  }

  for (const [matric, sum] of sums) {
    const entry = out[matric];
    if (entry && entry.marked > 0) {
      entry.pct = Math.round((sum / entry.marked) * 100);
    }
  }

  return out;
}

/** How much has been recorded for a course, for the overview. */
export async function getCourseSummary(
  course: string
): Promise<{ students: number; sessions: number; lastMarkedAt: string | null }> {
  const rows = await rest<
    { session_date: string; marked_at: string | null }[]
  >(
    `attendance?course=eq.${encodeURIComponent(course)}&select=session_date,marked_at`
  );

  const dates = new Set<string>();
  let last: string | null = null;
  for (const row of rows ?? []) {
    dates.add(row.session_date);
    if (row.marked_at && (!last || row.marked_at > last)) last = row.marked_at;
  }

  const roster = await getRoster(course);
  return { students: roster.length, sessions: dates.size, lastMarkedAt: last };
}

/**
 * A summary for every course at once.
 *
 * One request rather than one per course. The overview reads this, and the
 * table is small enough that fetching the rows and counting them here is
 * cheaper than the round trips it replaces.
 */
export async function getAllSummaries(): Promise<
  Record<string, { sessions: number; lastMarkedAt: string | null }>
> {
  const rows = await rest<{ course: string; session_date: string; marked_at: string | null }[]>(
    "attendance?select=course,session_date,marked_at"
  );

  const dates = new Map<string, Set<string>>();
  const last = new Map<string, string>();

  for (const row of rows ?? []) {
    let set = dates.get(row.course);
    if (!set) {
      set = new Set<string>();
      dates.set(row.course, set);
    }
    set.add(row.session_date);
    if (row.marked_at && (!last.get(row.course) || row.marked_at > last.get(row.course)!)) {
      last.set(row.course, row.marked_at);
    }
  }

  const out: Record<string, { sessions: number; lastMarkedAt: string | null }> = {};
  for (const [course, set] of dates) {
    out[course] = { sessions: set.size, lastMarkedAt: last.get(course) ?? null };
  }
  return out;
}

/** The correction history for one course and date. */
export async function getHistory(
  course: string,
  sessionDate: string
): Promise<
  {
    matric: string;
    old_fill: number | null;
    new_fill: number | null;
    old_excused: boolean;
    new_excused: boolean;
    changed_at: string;
    changed_by: string | null;
  }[]
> {
  const rows = await rest<
    {
      matric: string;
      old_fill: number | null;
      new_fill: number | null;
      old_excused: boolean;
      new_excused: boolean;
      changed_at: string;
      changed_by: string | null;
    }[]
  >(
    `attendance_log?course=eq.${encodeURIComponent(course)}&session_date=eq.${sessionDate}&select=*&order=changed_at.desc&limit=50`
  );
  return rows ?? [];
}
