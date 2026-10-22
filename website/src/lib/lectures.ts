import {
  ACADEMIC_CALENDAR_EVENTS,
  SESSION_ANCHORS,
  type CalendarEvent,
} from "@/lib/calendar";
import { SCHEDULE } from "@/lib/schedule";
import { addDays, dayIndex, describe } from "@/lib/session-dates";
import { breaksIn, breakPhrase } from "@/lib/breaks";
import type { BreakSetting } from "@/lib/breaks";

/**
 * The lectures, as real dates.
 *
 * The timetable is a weekly pattern, and a calendar wants dates. So the
 * pattern is applied to every teaching day of the published session, and
 * each one becomes a lecture somebody can be reminded about.
 *
 * The two things that make this worth doing, and the two things that make
 * it dangerous, are the same:
 *
 * The Registrar published when the lectures start, when they end, when the
 * examinations are, and which days are public holidays. All of that is in
 * the academic calendar, so the dates are not invented. What is invented is
 * the week between the published anchors, so the rule has to be careful:
 * a class on a day the department has called a holiday, or in the middle
 * of the examinations, is a class that does not happen, and a calendar
 * that says it does is worse than no calendar.
 *
 * So the exceptions come from the calendar and not from here. A day is
 * skipped when the calendar says the day is an examination, a revision
 * week, a semester break or a public holiday, and the academic calendar
 * is the only thing allowed to decide.
 */

/** A lecture, on a real date. */
export interface Lecture {
  /** The course code, "CYB 305". */
  course: string;
  /** The course title. */
  title: string;
  /** "2026-10-12". */
  date: string;
  /** 0 = Sunday. */
  dayIndex: number;
  /** Minutes from midnight, Lagos. */
  startMin: number;
  endMin: number;
  venue: string;
  lecturer: string;
  /** The break times, for the description. */
  breakPhrase: string;
}

/** How long the calendar runs, and when the lectures stop. */
const WINDOWS = [
  {
    from: SESSION_ANCHORS.sessionStart,
    to: SESSION_ANCHORS.examStart,
  },
  {
    from: SESSION_ANCHORS.semester2Start,
    to: SESSION_ANCHORS.exam2Start,
  },
];

/**
 * The calendar day a date falls on, as "2026-10-12".
 *
 * The academic calendar reads its rows as local midnight, so a day has to be
 * taken back out of a date the same way it went in. Asking a date for its
 * UTC day instead shifts it a day on a server that is not in UTC, and then
 * a public holiday is blocked on the day before it, and the lecture on the
 * holiday itself is in the calendar.
 */
function isoOf(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/**
 * The days the calendar says there is no lecture.
 *
 * A day is out when the calendar puts an examination, a revision week, a
 * semester break or a public holiday on it. The examinations and the
 * breaks are spans, so every day in them is out.
 */
export function blockedDays(): Set<string> {
  const out = new Set<string>();

  for (const event of ACADEMIC_CALENDAR_EVENTS) {
    const blocks =
      event.category === "Exams & Results" ||
      event.category === "Holidays & Breaks";
    if (!blocks) continue;
    if (!event.start) continue;

    // A span covers every day from its first day to its last, and a single
    // day covers itself.
    const last = event.end && event.end.getTime() > event.start.getTime()
      ? event.end
      : event.start;

    let iso = isoOf(event.start);
    const lastIso = isoOf(last);
    while (iso <= lastIso) {
      out.add(iso);
      iso = addDays(iso, 1);
    }
  }

  return out;
}

/**
 * Every lecture of the published session.
 *
 * The dates come from the academic calendar and the times from the
 * timetable, so the two cannot disagree about when a class is.
 */
export function lectures(
  settings: readonly BreakSetting[] = [],
  now: Date = new Date()
): Lecture[] {
  const blocked = blockedDays();
  const today = isoOf(now);
  const out: Lecture[] = [];

  for (const window of WINDOWS) {
    let iso = isoOf(window.from);
    const lastIso = isoOf(window.to);

    while (iso <= lastIso) {
      if (!blocked.has(iso)) {
        const day = dayIndex(iso);

        for (const course of SCHEDULE.filter((c) => c.dayIndex === day)) {
          const length = settings.find(
            (s) =>
              s.course === course.code &&
              s.dayIndex === day &&
              s.startMin === course.startMin
          );
          const breakMin = length ? length.breakMin : 10;

          out.push({
            course: course.code,
            title: course.title,
            date: iso,
            dayIndex: day,
            startMin: course.startMin,
            endMin: course.endMin,
            venue: course.venue,
            lecturer: course.lecturer,
            breakPhrase: breakPhrase(
              course.startMin,
              course.endMin,
              breakMin
            ),
          });
        }
      }

      iso = addDays(iso, 1);
    }
  }

  // The past comes first, so a calendar that shows the last thing first
  // ends on what is next.
  return out.sort((a, b) => (a.date === b.date ? a.startMin - b.startMin : a.date < b.date ? -1 : 1));
}

/** The lectures still to come. */
export function upcomingLectures(
  settings: readonly BreakSetting[] = [],
  now: Date = new Date()
): Lecture[] {
  const today = isoOf(now);
  return lectures(settings, now).filter((l) => l.date >= today);
}

/** "Wednesday 12 October", for a description. */
export function lectureDate(iso: string): string {
  const d = describe(iso);
  return `${d.weekday} ${d.day} ${d.month}`;
}

/** The breaks inside a lecture, for a check. */
export function lectureBreaks(lecture: Lecture, breakMin: number) {
  return breaksIn(lecture.startMin, lecture.endMin, breakMin);
}
