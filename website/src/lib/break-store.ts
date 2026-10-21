import "server-only";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { rest } from "@/lib/rest";
import { MAX_BREAK_MIN, type BreakSetting } from "@/lib/breaks";

/**
 * Where the breaks are kept.
 *
 * The timetable is in the code, because the published timetable does not
 * change from one term to the next. The breaks are in the database, because
 * they do: a lecturer decides, and nobody redeploys the site for it.
 */

interface BreakRow {
  course: string;
  day_index: number;
  start_min: number;
  break_min: number;
}

/**
 * Every session's break, for every course.
 *
 * A session that is not in the table has the default break, which is ten
 * minutes. The table only holds the ones somebody has changed.
 */
export async function getAllBreaks(): Promise<BreakSetting[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("schedule");

  try {
    const rows = await rest<BreakRow[]>(
      "session_breaks?select=course,day_index,start_min,break_min"
    );
    return (rows ?? []).map((r) => ({
      course: r.course,
      dayIndex: r.day_index,
      startMin: r.start_min,
      breakMin: r.break_min,
    }));
  } catch {
    return [];
  }
}

/**
 * Set the break in a session.
 *
 * Zero means the lecture runs straight through, and it is a real setting
 * rather than the absence of one, so it is written down rather than left out.
 */
export async function setBreak(args: {
  course: string;
  dayIndex: number;
  startMin: number;
  breakMin: number;
  by?: string;
}): Promise<void> {
  const breakMin = Math.max(
    0,
    Math.min(Math.round(args.breakMin), MAX_BREAK_MIN)
  );

  await rest("session_breaks?on_conflict=course,day_index,start_min", {
    method: "POST",
    body: {
      course: args.course,
      day_index: args.dayIndex,
      start_min: args.startMin,
      break_min: breakMin,
      updated_by: args.by ?? null,
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  updateTag("schedule");
}
