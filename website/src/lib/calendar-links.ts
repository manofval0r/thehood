/**
 * Calendar link builders for assignment deadlines.
 *
 * The site has no account in anyone's calendar system, so the two supported
 * ways to get an assignment onto a phone are a Google Calendar template URL
 * and an Outlook deep link, plus a downloaded .ics file for anything else.
 * All three are built here so the assignment card and the course page agree.
 *
 * Times are floating local (Africa/Lagos), matching how the timetable page
 * publishes its times.
 */

export interface CalendarEvent {
  /** What the calendar names the event. */
  title: string;
  /** ISO or Date for the moment it is due. */
  dueAt: string | Date;
  /** Extra text for the body — course, submission method, notes. */
  details?: string;
  /** Where it happens, when it is worth putting on a calendar. */
  location?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function floating(dueAt: string | Date, offsetMinutes = 0) {
  const d = new Date(new Date(dueAt).getTime() + offsetMinutes * 60_000);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
    d.getHours()
  )}${pad(d.getMinutes())}00`;
}

const enc = encodeURIComponent;

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${floating(event.dueAt)}/${floating(event.dueAt, 30)}`,
    ctz: "Africa/Lagos",
  });
  if (event.details) params.set("details", event.details);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const d = new Date(event.dueAt);
  const iso = (offsetMinutes = 0) => {
    const t = new Date(d.getTime() + offsetMinutes * 60_000);
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(
      t.getDate()
    )}T${pad(t.getHours())}:${pad(t.getMinutes())}:00`;
  };
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: iso(),
    enddt: iso(30),
  });
  if (event.details) params.set("body", event.details);
  if (event.location) params.set("location", event.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(event: CalendarEvent, uid: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Hood//Cybersecurity 300L//EN",
    "BEGIN:VEVENT",
    `UID:${icsEscape(uid)}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;TZID=Africa/Lagos:${floating(event.dueAt)}`,
    `DTEND;TZID=Africa/Lagos:${floating(event.dueAt, 30)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    event.details ? `DESCRIPTION:${icsEscape(event.details)}` : null,
    event.location ? `LOCATION:${icsEscape(event.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(event: CalendarEvent, filename: string, uid: string): void {
  const blob = new Blob([buildIcs(event, uid)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Filesystem-safe-ish filename for the downloaded event. */
export function icsFilename(title: string): string {
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "assignment"}.ics`;
}

export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  return m ? m[1] : null;
}
