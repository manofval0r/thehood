import type { CalendarEvent } from "./calendar";

/**
 * RFC 5545 calendar generation for the published academic calendar.
 *
 * Scope is deliberately only the dates the Registrar published. A recurring
 * weekly lecture series would have to invent term start and end dates, and a
 * subscription that silently ignores exam week and public holidays is worse
 * than no subscription at all.
 */

const PRODID = "-//NUTM//Cybersecurity 300L Academic Calendar//EN";

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
