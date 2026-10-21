/**
 * The breaks inside a lecture.
 *
 * A lecture is a series of periods. Within a period the teaching runs and
 * then there is a break, and the break is the last few minutes of the
 * period. The final period has no break in it, because the class ends when
 * it was scheduled to end.
 *
 * So a three hour lecture with a ten minute break is:
 *
 *   9:00 - 9:50   teaching
 *   9:50 - 10:00  break
 *   10:00 - 10:50 teaching
 *   10:50 - 11:00 break
 *   11:00 - 12:00 teaching
 *
 * Twenty minutes of break, and the class still ends at noon. A one hour
 * lecture is a single period, so it has no break in it, and a two hour
 * lecture has one.
 *
 * The length is set per session, because a lecturer's coffee break is not
 * the same as a practical's. The default is ten minutes, which is what most
 * of them take.
 *
 * This file is pure arithmetic and is shared by the server and the browser,
 * so the countdown and the timetable cannot disagree about where a break
 * falls.
 */

/** How long a lecture period is. */
export const PERIOD_MIN = 60;

/** The break most lectures take. */
export const DEFAULT_BREAK_MIN = 10;

/** The longest break anybody can set. Longer than this and it is a gap. */
export const MAX_BREAK_MIN = 30;

export interface BreakSetting {
  course: string;
  /** 0 = Sunday, matching Date.getDay(). */
  dayIndex: number;
  /** Minutes from midnight, the start of the session. */
  startMin: number;
  /** How long the break is. */
  breakMin: number;
}

export type Segment =
  | { kind: "teach"; from: number; to: number }
  | { kind: "break"; from: number; to: number };

/**
 * The teaching and the breaks in a session.
 *
 * The periods run from the start of the session, not from the hour, so a
 * lecture that starts at ten past nine breaks at ten to ten and not at ten.
 */
export function segmentsFor(
  startMin: number,
  endMin: number,
  breakMin: number
): Segment[] {
  const out: Segment[] = [];
  if (endMin <= startMin) return [{ kind: "teach", from: startMin, to: endMin }];

  const length = Math.max(0, Math.min(breakMin, MAX_BREAK_MIN));
  let cursor = startMin;

  while (cursor < endMin) {
    const periodEnd = Math.min(cursor + PERIOD_MIN, endMin);
    const isLast = periodEnd >= endMin;
    const breakStart = periodEnd - length;

    // The last period has no break in it: the class ends when it was
    // scheduled to end.
    if (length > 0 && !isLast && breakStart > cursor) {
      out.push({ kind: "teach", from: cursor, to: breakStart });
      out.push({ kind: "break", from: breakStart, to: periodEnd });
    } else {
      out.push({ kind: "teach", from: cursor, to: periodEnd });
    }
    cursor = periodEnd;
  }

  return out;
}

/** The key a session's break is stored under. */
export function breakKey(
  course: string,
  dayIndex: number,
  startMin: number
): string {
  return `${course}|${dayIndex}|${startMin}`;
}

/** The break length for a session, from the settings, or the default. */
export function breakFor(
  settings: readonly BreakSetting[],
  course: string,
  dayIndex: number,
  startMin: number
): number {
  const found = settings.find(
    (s) =>
      s.course === course && s.dayIndex === dayIndex && s.startMin === startMin
  );
  return found ? found.breakMin : DEFAULT_BREAK_MIN;
}

/** The breaks in a session, without the teaching. */
export function breaksIn(
  startMin: number,
  endMin: number,
  breakMin: number
): Segment[] {
  return segmentsFor(startMin, endMin, breakMin).filter(
    (s): s is Extract<Segment, { kind: "break" }> => s.kind === "break"
  );
}

/** How long the teaching runs, in minutes. */
export function teachingMinutes(
  startMin: number,
  endMin: number,
  breakMin: number
): number {
  return segmentsFor(startMin, endMin, breakMin)
    .filter((s) => s.kind === "teach")
    .reduce((n, s) => n + (s.to - s.from), 0);
}

/** The segment a moment falls in, or null when the class is not running. */
export function segmentAt(
  startMin: number,
  endMin: number,
  breakMin: number,
  minute: number
): Segment | null {
  if (minute < startMin || minute >= endMin) return null;
  return (
    segmentsFor(startMin, endMin, breakMin).find(
      (s) => minute >= s.from && minute < s.to
    ) ?? null
  );
}

/** "9:50am and 10:50am", for a sentence about when the breaks are. */
export function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = String(minutes % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm}${h24 < 12 ? "am" : "pm"}`;
}

/** "9:50am", for a list of break times. */
export function breakTimes(
  startMin: number,
  endMin: number,
  breakMin: number
): string[] {
  return breaksIn(startMin, endMin, breakMin).map((b) => clockLabel(b.from));
}

/** "break at 9:50am" or "breaks at 9:50am and 10:50am". */
export function breakPhrase(
  startMin: number,
  endMin: number,
  breakMin: number
): string {
  const times = breakTimes(startMin, endMin, breakMin);
  if (times.length === 0) return "";
  if (times.length === 1) return `break at ${times[0]}`;
  const last = times[times.length - 1];
  return `breaks at ${times.slice(0, -1).join(", ")} and ${last}`;
}
