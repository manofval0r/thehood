import type { CalendarEvent } from "./calendar";
import type { Lecture } from "./lectures";

/**
 * RFC 5545 calendar generation.
 *
 * Two calendars. The academic calendar is the dates the Registrar
 * published. The lectures are the weekly timetable applied to the days of
 * the published session, with the examination weeks and the public
 * holidays left out, because the academic calendar says which days those
 * are and a class on a public holiday is not a class.
 *
 * The times are written with a time zone rather than as floating local
 * times, because a lecture is at half past twelve in Lagos and a reader
 * in another country should see the Lagos time, not their own.
 */

const PRODID = "-//NUTM//Cybersecurity 300L Academic Calendar//EN";
const LECTURE_PRODID = "-//NUTM//Cybersecurity 300L Lectures//EN";

/** Lagos is UTC+1 all year and has no daylight saving. */
const LAGOS_TZID = "Africa/Lagos";

/** Text values must escape backslash, semicolon, comma and newline. */
function esc(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * RFC 5545 caps a content line at 75 octets. Folding inserts CRLF plus a
 * single space, so each continuation gets one octet less budget.
 */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

function ymd(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
}

function dtstamp(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `T${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}Z`
  );
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Stable identifier. The month plus the activity text is the event's identity. */
function uid(e: CalendarEvent) {
  const slug = `${e.month}-${e.activity}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${slug}@nutm.edu.ng`;
}

export interface IcsResult {
  text: string;
  /** Events written, and events skipped for having no published date. */
  added: number;
  skipped: number;
}

export function buildCalendar(events: CalendarEvent[], origin: string): IcsResult {
  const now = new Date();
  const out: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NUTM 2026/2027 Academic Calendar",
    "X-WR-TIMEZONE:Africa/Lagos",
  ];

  let added = 0;
  let skipped = 0;

  for (const e of events) {
    // An event the department has not dated cannot go on a calendar.
    if (!e.start) {
      skipped++;
      continue;
    }

    // All-day events use an exclusive DTEND, so a one-day event spans
    // DTSTART <= date < DTEND.
    const end = e.end && e.end.getTime() > e.start.getTime() ? e.end : e.start;
    const dtend = addDays(
      new Date(end.getFullYear(), end.getMonth(), end.getDate()),
      1
    );

    out.push(
      "BEGIN:VEVENT",
      `UID:${uid(e)}`,
      `DTSTAMP:${dtstamp(now)}`,
      `DTSTART;VALUE=DATE:${ymd(e.start)}`,
      `DTEND;VALUE=DATE:${ymd(dtend)}`,
      fold(`SUMMARY:${esc(e.activity)}`),
      fold(`DESCRIPTION:${esc(`${e.date} (${e.day})`)}`),
      fold(`CATEGORIES:${esc(e.category)}`),
      fold(`URL:${origin}/timeline`),
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
    added++;
  }

  out.push("END:VCALENDAR");

  return { text: out.map(fold).join("\r\n") + "\r\n", added, skipped };
}

/**
 * The time zone block.
 *
 * A zone with no daylight saving needs one standard offset, and a
 * reader that cannot find the zone it is told about will show the time
 * in the reader's own clock, which is wrong for a class that is in Lagos
 * at a fixed time.
 */
function lagosTimeZone(): string[] {
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${LAGOS_TZID}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0100",
    "TZNAME:WAT",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}

/** "20261012T123000" for a Lagos wall-clock time. */
function stamp(iso: string, minutes: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${iso.replace(/-/g, "")}T${p(h)}${p(m)}00`;
}

/** A stable identifier for a lecture on a date. */
function lectureUid(lecture: Lecture): string {
  return (
    `${lecture.course}-${lecture.date}-${lecture.startMin}`.replace(/[^\w-]/g, "-") +
    "@nutm.edu.ng"
  );
}

export interface LectureCalendarResult {
  text: string;
  added: number;
  skipped: number;
}

/**
 * The lectures as a calendar.
 *
 * Every lecture is written out as its own event rather than as one
 * repeating rule. A repeating rule cannot skip the examination weeks and
 * the public holidays, and a class that is in the reader's calendar on a
 * day the department has called a holiday is a class they will turn up
 * for.
 */
export function buildLectureCalendar(
  lectures: Lecture[],
  origin: string
): LectureCalendarResult {
  const now = new Date();
  const out: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${LECTURE_PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Your Cybersecurity 300L lectures",
    `X-WR-TIMEZONE:${LAGOS_TZID}`,
    ...lagosTimeZone(),
  ];

  let added = 0;
  let skipped = 0;

  for (const lecture of lectures) {
    if (!lecture.date || lecture.endMin <= lecture.startMin) {
      skipped++;
      continue;
    }

    const description = [
      lecture.venue ? `Venue: ${lecture.venue}` : null,
      lecture.lecturer ? `Lecturer: ${lecture.lecturer}` : null,
      lecture.breakPhrase || null,
    ]
      .filter(Boolean)
      // A real newline, which esc() turns into the "\n" the format asks
      // for. Joining on a literal backslash-n would be escaped again and
      // come out as a backslash and an n.
      .join("\n");

    out.push(
      "BEGIN:VEVENT",
      `UID:${lectureUid(lecture)}`,
      `DTSTAMP:${dtstamp(now)}`,
      `DTSTART;TZID=${LAGOS_TZID}:${stamp(lecture.date, lecture.startMin)}`,
      `DTEND;TZID=${LAGOS_TZID}:${stamp(lecture.date, lecture.endMin)}`,
      fold(`SUMMARY:${esc(`${lecture.course}: ${lecture.title}`)}`),
      fold(`DESCRIPTION:${esc(description)}`),
      fold(`LOCATION:${esc(lecture.venue)}`),
      fold(`CATEGORIES:${esc("Lectures")}`),
      fold(`URL:${origin}/timetable`),
      // A lecture is a place to be, so the reader is told to be there.
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
    added++;
  }

  out.push("END:VCALENDAR");

  return { text: out.map(fold).join("\r\n") + "\r\n", added, skipped };
}
