import { COURSES } from "./resources";

/**
 * Weekly teaching schedule derived from the published timetable.
 *
 * Both the navbar countdown and the landing countdown read this, so there is
 * one answer to "what is next" on the site rather than two that can disagree.
 */

export interface ScheduledCourse {
  slug: string;
  code: string;
  title: string;
  venue: string;
  lecturer: string;
  /** 0 = Sunday, matching Date.getDay(). */
  dayIndex: number;
  dayName: string;
  /** Minutes from midnight. */
  startMin: number;
  endMin: number;
}

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/** "1:00pm - 4:00pm" and "9:00am - 12:00pm" both appear in the timetable. */
function parseClock(value: string, fallback: number): number {
  const m = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return fallback;
  let hour = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) hour += 12;
  return hour * 60 + Number(m[2]);
}

function buildSchedule(): ScheduledCourse[] {
  const out: ScheduledCourse[] = [];
  for (const c of COURSES) {
    const dayIndex = DAY_INDEX[c.day];
    if (dayIndex === undefined) continue;
    // The timetable stores the range as "1:00pm - 4:00pm".
    const [from, to] = c.time.split(/\s*-\s*/);
    const startMin = parseClock(from ?? "", 9 * 60);
    const endMin = parseClock(to ?? "", startMin + 120);
    out.push({
      slug: c.slug,
      code: c.code,
      title: c.title,
      venue: c.venue,
      lecturer: c.lecturer,
      dayIndex,
      dayName: c.day,
      startMin,
      endMin,
    });
  }
  return out.sort((a, b) => a.dayIndex - b.dayIndex || a.startMin - b.startMin);
}

export const SCHEDULE: ScheduledCourse[] = buildSchedule();

/** Teaching days, in week order. */
export const TEACHING_DAYS = [...new Set(SCHEDULE.map((s) => s.dayIndex))].sort(
  (a, b) => a - b
);

export interface NextClass {
  course: ScheduledCourse;
  /** When this class next meets. */
  startsAt: Date;
  endsAt: Date;
  /** True when the class is happening right now. */
  inProgress: boolean;
  /** True when it is the class for today and has not started yet. */
  isToday: boolean;
  daysAway: number;
}

/**
 * The class a student should care about next.
 *
 * Preference order: a class currently running, then the next one today, then
 * the next teaching day. Anything already finished today is skipped rather
 * than counting down to a lesson that has ended.
 */
export function nextClass(now: Date): NextClass | null {
  if (SCHEDULE.length === 0) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Running now.
  for (const course of SCHEDULE) {
    if (course.dayIndex !== now.getDay()) continue;
    if (nowMin >= course.startMin && nowMin < course.endMin) {
      const startsAt = atMinutes(now, course.startMin);
      return {
        course,
        startsAt,
        endsAt: atMinutes(now, course.endMin),
        inProgress: true,
        isToday: true,
        daysAway: 0,
      };
    }
  }

  // Later today.
  for (const course of SCHEDULE) {
    if (course.dayIndex !== now.getDay()) continue;
    if (nowMin < course.startMin) {
      return {
        course,
        startsAt: atMinutes(now, course.startMin),
        endsAt: atMinutes(now, course.endMin),
        inProgress: false,
        isToday: true,
        daysAway: 0,
      };
    }
  }

  // The next teaching day within the coming week.
  for (let offset = 1; offset <= 7; offset++) {
    const dayIndex = (now.getDay() + offset) % 7;
    if (!TEACHING_DAYS.includes(dayIndex)) continue;
    const forDay = SCHEDULE.filter((c) => c.dayIndex === dayIndex);
    if (forDay.length === 0) continue;
    const first = forDay[0];
    const target = new Date(now);
    target.setDate(target.getDate() + offset);
    const startsAt = atMinutes(target, first.startMin);
    return {
      course: first,
      startsAt,
      endsAt: atMinutes(target, first.endMin),
      inProgress: false,
      isToday: false,
      daysAway: offset,
    };
  }

  return null;
}

function atMinutes(day: Date, minutes: number) {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/** Every class scheduled for a given weekday, in timetable order. */
export function classesOn(dayIndex: number) {
  return SCHEDULE.filter((c) => c.dayIndex === dayIndex);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** HH:MM:SS, the format a countdown should read in. */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
