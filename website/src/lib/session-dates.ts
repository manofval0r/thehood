/**
 * Calendar helpers for attendance.
 *
 * Dates here are plain calendar days, written as "yyyy-mm-dd" and never as a
 * timestamp. A class happens on a Tuesday; it does not happen at an instant
 * that can be shifted by whichever timezone the server happens to run in.
 * Everything below works in UTC internally so a week is a week wherever the
 * code is executed.
 */

/** Lagos is UTC+1 all year, with no daylight saving. */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** Today, as it is in Lagos. */
export function todayIso(now: number = Date.now()): string {
  return new Date(now + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Move a calendar day by a number of days. */
export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** 0 = Sunday, matching Date.getUTCDay(). */
export function dayIndex(iso: string): number {
  return toUtc(iso).getUTCDay();
}

/** The Monday of the week the given day falls in. */
export function startOfWeek(iso: string): string {
  const index = dayIndex(iso);
  const back = (index + 6) % 7; // Monday is the first day of the week here.
  return addDays(iso, -back);
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface CalendarDay {
  iso: string;
  weekday: string;
  day: string;
  month: string;
}

/** Lagos is UTC+1 all year, with no daylight saving. */
export const LAGOS_OFFSET_MINUTES = 60;

/**
 * The instant of a time of day, in Lagos, on a given calendar day.
 *
 * The class times in the manifest are wall-clock times in Lagos, so the
 * instant has to be built in Lagos terms. Building it in the server's own
 * timezone puts every class an hour out on a server running in UTC, which
 * means every reminder arrives an hour early.
 */
export function lagosInstant(iso: string, minutesFromMidnight: number): Date {
  const d = toUtc(iso);
  // The whole offset is applied in minutes, in one place. Writing it as
  // "hours minus the offset" is how an offset of sixty minutes became
  // sixty hours, and every class in the timetable moved three days.
  return new Date(
    d.getTime() + (minutesFromMidnight - LAGOS_OFFSET_MINUTES) * 60 * 1000
  );
}

/** The calendar day an instant falls on, in Lagos. */
export function lagosDay(date: Date): string {
  return new Date(date.getTime() + LAGOS_OFFSET_MINUTES * 60000)
    .toISOString()
    .slice(0, 10);
}

/** The clock of an instant, in Lagos, as HH:MM. */
export function lagosClock(date: Date): string {
  const shifted = new Date(date.getTime() + LAGOS_OFFSET_MINUTES * 60000);
  return shifted.toISOString().slice(11, 16);
}

/** The weekday of a calendar day, 0 = Sunday. */
export function dayOf(iso: string): number {
  return toUtc(iso).getUTCDay();
}

export function describe(iso: string): CalendarDay {
  const d = toUtc(iso);
  return {
    iso,
    weekday: WEEKDAYS[d.getUTCDay()],
    day: String(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
  };
}

/** "Monday 20 October 2026", for the places where the whole date is wanted. */
export function longDate(iso: string): string {
  const d = toUtc(iso);
  const full = [
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
  ][d.getUTCMonth()];
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${full} ${d.getUTCFullYear()}`;
}

/**
 * The classes inside one week.
 *
 * Only the days the course actually meets become columns. A course that runs
 * on Tuesdays gets one column a week, and a course that meets twice gets
 * two, because the count of boxes has to match the count of classes.
 */
export function classesInWeek(
  weekStart: string,
  dayIndexes: number[]
): CalendarDay[] {
  const wanted = new Set(dayIndexes);
  const out: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = addDays(weekStart, i);
    if (wanted.has(dayIndex(iso))) out.push(describe(iso));
  }
  return out;
}
