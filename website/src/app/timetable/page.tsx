import Link from "next/link";
import { CalendarPlus, Download } from "lucide-react";
import TakeawayPills from "@/components/TakeawayPills";
import { COURSES, resourceUrl, TIMETABLE_PDF } from "@/lib/resources";
import { SCHEDULE, type ScheduledCourse } from "@/lib/schedule";
import { getAllBreaks } from "@/lib/break-store";
import NoteArt from "@/components/NoteArt";
import PrintButton from "@/components/PrintButton";
import Reveal from "@/components/Reveal";
import TimetableBoard from "@/components/TimetableBoard";

/**
 * How many weekly sessions each room runs.
 *
 * Counted from SCHEDULE rather than written down. These were hardcoded, so
 * adding the Monday CYB 303 session would have left the header claiming PG 2
 * runs three times a week while the table below it showed four, and the two
 * numbers would have agreed on nothing.
 */
const VENUES: [string, number][] = (() => {
  const counts = new Map<string, number>();
  for (const s of SCHEDULE) {
    counts.set(s.venue, (counts.get(s.venue) ?? 0) + 1);
  }
  // Busiest first, so the largest number leads and the row has a shape.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, n]) => [name, n] as [string, number]);
})();

/** Weekly sessions in total. Exceeds the course count when a course meets
 *  more than once a week, which is why it is not just COURSES.length. */
const WEEKLY_SESSIONS = SCHEDULE.length;

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * The grid, grouped by day.
 *
 * Derived from SCHEDULE rather than typed out here. This page used to carry
 * its own copy of every slot, which meant a session could exist in one place
 * and not the other: adding Monday 10:00am CYB 303 to this array would have
 * left the countdown, which reads the manifest, believing that class does not
 * happen. One source, two readers.
 */
const ORDERED: Record<string, ScheduledCourse[]> = (() => {
  const byDay: Record<string, ScheduledCourse[]> = {};
  for (const slot of SCHEDULE) {
    (byDay[slot.dayName] ??= []).push(slot);
  }
  return byDay;
})();

export const metadata = {
  title: "Timetable · Cybersecurity 300L",
  description: "First Semester 2026/2027 weekly timetable for the Cybersecurity 300 Level programme.",
};

export default async function TimetablePage() {
  const totalUnits = COURSES.reduce((s, c) => s + c.units, 0);

  // Read here rather than taken from the bar, so that this page's own cache
  // entry depends on the breaks and a change to one reaches it.
  const breaks = await getAllBreaks();

  /*
   * The feed, and the two subscribe links built from it.
   *
   * These are the credential-free way in: Google and Outlook both fetch the
   * .ics themselves and keep it up to date, so nobody has to authorize this
   * site to read their calendar. The OAuth routes under /api/calendar are
   * for the richer two-way sync later; they are not what these buttons use,
   * because a button that needs a secret nobody has set is a button that
   * does nothing.
   */
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://nutmcybersecurity.vercel.app";
  const feed = `${origin}/timetable.ics`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    feed
  )}`;
  const outlookCalendarUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(
    feed
  )}&name=${encodeURIComponent("Cybersecurity 300L timetable")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Identifies the sheet once it is loose from the site. */}
      <div className="print-only mb-6 border-b border-border pb-4">
        <p className="text-[10pt] font-bold uppercase tracking-[0.12em]">
          Nigerian University of Technology and Management
        </p>
        <p className="mt-1 text-[9pt] text-muted-foreground">
          Department of Cybersecurity &middot; First Semester 2026/2027
        </p>
      </div>

      {/* Header */}
      <section className="rise pb-8 pt-14 md:pt-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
              First Semester Timetable
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              2026/2027 session. Every course code links to its resources page.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2.5 self-start">
            <a
              href={resourceUrl(TIMETABLE_PDF)}
              download
              className="print-hide pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 max-sm:min-h-11"
            >
              <Download size={15} />
              Download PDF
            </a>

            {/* Calendar options: subscribe via Google, Outlook, or download .ics */}
            <div className="mt-2.5 flex flex-col gap-2">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.27-4.8 3.27-8.09z"/><path fill="#34A853" d="M12 23c2.25 0 4.26-.75 5.7-1.94v-3.42h-3.57c-.26.56-.74 1-1.37 1.24-1.04.4-2.18.66-3.44.66-2.62 0-4.8-2.11-5.23-4.77h-3.58v2.69h-3.58v-2.69h3.57v-1.09c0-2.26 1.39-4.23 3.25-5.33h2.16v2.06h-3.03c-.03.26-.07.51-.07.79 0 .37.09.71.19 1.05h3.31v2.06h-3.31c-.27.64-.68 1.24-1.22 1.72-.84.78-1.89 1.33-3.07 1.33-2.33 0-4.25-1.82-4.25-4.13 0-2.26 1.65-4.13 3.93-4.13 1.53 0 2.91.68 3.73 1.61v1.74h3.31v-1.87c0-1.03.3-2.01.77-2.81 1.01-1.39 2.59-2.25 4.17-2.25 1.92 0 3.67.84 4.85 2.24 1.29 1.5 1.92 3.5 1.92 5.79 0 2.6-1.42 4.91-3.73 6.15h-3.45v-2.42h3.31c.16-.64.26-1.32.26-2.07 0-2.07-1.18-3.84-3.12-4.94h-2.95v-2.03h3.22c.3-.77.49-1.56.49-2.43 0-1.5-.59-2.94-1.48-4.08l-2.46-.59c-.39-.48-.99-.82-1.68-.99-1.35-.4-2.77-.64-4.25-.64-3.62 0-6.49 2.61-6.49 6.09 0 3.56 2.82 6.39 6.45 6.75v2.21h3.62c.27-.67.64-1.3 1.13-1.83 1.04-1.21 2.37-1.98 3.89-2.23 1.54-.25 3.14-.25 4.67-.25 3.54 0 6.38 2.73 6.38 6.09 0 3.42-2.79 6.02-6.25 6.09h-3.64v-2.69h3.45c.43-.91.78-1.87 1.02-2.84h2.87z"/><path fill="#FBBC05" d="M12 5.42c1.48 0 2.79.43 3.93 1.17v1.84h-3.57c-.26-.51-.73-.9-1.36-1.17-1.04-.66-2.37-1.04-3.81-1.04-2.59 0-4.77 2.01-4.77 4.45s2.18 4.45 4.77 4.45c1.44 0 2.77-.38 3.81-1.04 1.28-.79 2.03-1.98 2.03-3.39 0-1.22-.61-2.28-1.44-3.04l-2.46-.79c-.39-.48-.99-.82-1.68-.99-1.35-.4-2.77-.64-4.25-.64-3.62 0-6.49 2.61-6.49 6.09 0 3.56 2.82 6.39 6.45 6.75v2.21h3.62c.27-.67.64-1.3 1.13-1.83 1.04-1.21 2.37-1.98 3.89-2.23 1.54-.25 3.14-.25 4.67-.25 3.54 0 6.38 2.73 6.38 6.09 0 3.42-2.79 6.02-6.25 6.09h-3.64v-2.69h3.45c.43-.91.78-1.87 1.02-2.84h2.87z"/><path fill="#EB4224" d="M12 23c2.25 0 4.26-.75 5.7-1.94v-3.42h-3.57c-.26.56-.74 1-1.37 1.24-1.04.4-2.18.66-3.44.66-2.62 0-4.8-2.11-5.23-4.77h-3.58v2.69h-3.58v-2.69h3.57v-1.09c0-2.26 1.39-4.23 3.25-5.33h2.16v2.06h-3.03c-.03.26-.07.51-.07.79 0 .37.09.71.19 1.05h3.31v2.06h-3.31c-.27.64-.68 1.24-1.22 1.72-.84.78-1.89 1.33-3.07 1.33-2.33 0-4.25-1.82-4.25-4.13 0-2.26 1.65-4.13 3.93-4.13 1.53 0 2.91.68 3.73 1.61v1.74h3.31v-1.87c0-1.03.3-2.01.77-2.81 1.01-1.39 2.59-2.25 4.17-2.25 1.92 0 3.67.84 4.85 2.24 1.29 1.5 1.92 3.5 1.92 5.79 0 2.6-1.42 4.91-3.73 6.15h-3.45v-2.42h3.31c.16-.64.26-1.32.26-2.07 0-2.07-1.18-3.84-3.12-4.94h-2.95v-2.03h3.22c.3-.77.49-1.56.49-2.43 0-1.5-.59-2.94-1.48-4.08l-2.46-.59c-.39-.48-.99-.82-1.68-.99-1.35-.4-2.77-.64-4.25-.64-3.62 0-6.49 2.61-6.49 6.09 0 3.56 2.82 6.39 6.45 6.75v2.21h3.62c.27-.67.64-1.3 1.13-1.83 1.04-1.21 2.37-1.98 3.89-2.23 1.54-.25 3.14-.25 4.67-.25 3.54 0 6.38 2.73 6.38 6.09 0 3.42-2.79 6.02-6.25 6.09h-3.64v-2.69h3.45c.43-.91.78-1.87 1.02-2.84h2.87z"/><path fill="#F4B400" d="M12 23c2.25 0 4.26-.75 5.7-1.94v-3.42h-3.57c-.26.56-.74 1-1.37 1.24-1.04.4-2.18.66-3.44.66-2.62 0-4.8-2.11-5.23-4.77h-3.58v2.69h-3.58v-2.69h3.57v-1.09c0-2.26 1.39-4.23 3.25-5.33h2.16v2.06h-3.03c-.03.26-.07.51-.07.79 0 .37.09.71.19 1.05h3.31v2.06h-3.31c-.27.64-.68 1.24-1.22 1.72-.84.78-1.89 1.33-3.07 1.33-2.33 0-4.25-1.82-4.25-4.13 0-2.26 1.65-4.13 3.93-4.13 1.53 0 2.91.68 3.73 1.61v1.74h3.31v-1.87c0-1.03.3-2.01.77-2.81 1.01-1.39 2.59-2.25 4.17-2.25 1.92 0 3.67.84 4.85 2.24 1.29 1.5 1.92 3.5 1.92 5.79 0 2.6-1.42 4.91-3.73 6.15h-3.45v-2.42h3.31c.16-.64.26-1.32.26-2.07 0-2.07-1.18-3.84-3.12-4.94h-2.95v-2.03h3.22c.3-.77.49-1.56.49-2.43 0-1.5-.59-2.94-1.48-4.08l-2.46-.59c-.39-.48-.99-.82-1.68-.99-1.35-.4-2.77-.64-4.25-.64-3.62 0-6.49 2.61-6.49 6.09 0 3.56 2.82 6.39 6.45 6.75v2.21h3.62c.27-.67.64-1.3 1.13-1.83 1.04-1.21 2.37-1.98 3.89-2.23 1.54-.25 3.14-.25 4.67-.25 3.54 0 6.38 2.73 6.38 6.09 0 3.42-2.79 6.02-6.25 6.09h-3.64v-2.69h3.45c.43-.91.78-1.87 1.02-2.84h2.87z"/><path fill="#EB4224" d="M12 23c2.25 0 4.26-.75 5.7-1.94v-3.42h-3.57c-.26.56-.74 1-1.37 1.24-1.04.4-2.18.66-3.44.66-2.62 0-4.8-2.11-5.23-4.77h-3.58v2.69h-3.58v-2.69h3.57v-1.09c0-2.26 1.39-4.23 3.25-5.33h2.16v2.06h-3.03c-.03.26-.07.51-.07.79 0 .37.09.71.19 1.05h3.31v2.06h-3.31c-.27.64-.68 1.24-1.22 1.72-.84.78-1.89 1.33-3.07 1.33-2.33 0-4.25-1.82-4.25-4.13 0-2.26 1.65-4.13 3.93-4.13 1.53 0 2.91.68 3.73 1.61v1.74h3.31v-1.87c0-1.03.3-2.01.77-2.81 1.01-1.39 2.59-2.25 4.17-2.25 1.92 0 3.67.84 4.85 2.24 1.29 1.5 1.92 3.5 1.92 5.79 0 2.6-1.42 4.91-3.73 6.15h-3.45v-2.42h3.31c.16-.64.26-1.32.26-2.07 0-2.07-1.18-3.84-3.12-4.94h-2.95v-2.03h3.22c.3-.77.49-1.56.49-2.43 0-1.5-.59-2.94-1.48-4.08l-2.46-.59c-.39-.48-.99-.82-1.68-.99-1.35-.4-2.77-.64-4.25-.64-3.62 0-6.49 2.61-6.49 6.09 0 3.56 2.82 6.39 6.45 6.75v2.21h3.62c.27-.67.64-1.3 1.13-1.83 1.04-1.21 2.37-1.98 3.89-2.23 1.54-.25 3.14-.25 4.67-.25 3.54 0 6.38 2.73 6.38 6.09 0 3.42-2.79 6.02-6.25 6.09h-3.64v-2.69h3.45c.43-.91.78-1.87 1.02-2.84h2.87z"/></svg>
                  Add to Google Calendar
                </a>
                <a
                  href={outlookCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#00A4EF" d="M12 2C6.48 2 2 6.48 2 12c0 2.44.96 4.68 2.5 6.28l-1.75 1.86 2.16 3.15C12.43 21.72 13.22 22 14 22c5.52 0 10-4.48 10-10 0-5.52-4.48-10-10-10zm10.34 12.57c-1.45-.72-2.75-1.43-4.11-1.96l-.56-.25-.58-.24-.63-.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78s-2.33.3-3.57.78l-.63.25-.58.24-.56.25c-1.24-.48-2.38-.78-3.57-.78"/></svg>
                  Add to Outlook Calendar
                </a>
                <a
                  href="/timetable.ics"
                  download
                  className="pressable inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
                >
                  <Download size={15} />
                  Download .ics file
                </a>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]">How to add to your calendar:</p>
                <p className="text-[10px] leading-relaxed">
                  <a href="https://www.youtube.com/results?search_query=how+to+subscribe+to+a+calendar+by+url+google+calendar" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">Google Calendar</a>
                  {" · "}
                  <a href="https://www.youtube.com/results?search_query=how+to+subscribe+to+an+ics+calendar+in+outlook" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">Outlook Calendar</a>
                  {" · "}
                  <a href="https://www.youtube.com/results?search_query=how+to+import+an+ics+file+into+google+calendar" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">Import .ics file</a>
                </p>
              </div>
              <PrintButton />
          </div>
        </div>
      </section>

      <TimetableBoard
        byDay={ORDERED}
        totalUnits={totalUnits}
        courseCount={COURSES.length}
        weeklySessions={WEEKLY_SESSIONS}
        breaks={breaks}
      />

      {/* ---------- Notes, each with its own illustration ---------- */}
      <section className="grid gap-5 py-20 md:grid-cols-3">
        <NoteCard
          variant="calendar"
          title="Friday is free"
          body="No lectures are scheduled. It is the one full day you get back for revision, lab work, or reading ahead."
        />
        <NoteCard
          variant="plan"
          title={`${VENUES.length} venues`}
          body={`Every class is held in the ${VENUES.map(([n]) => n).join(", the ")}.`}
        >
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-[13px]">
            {VENUES.map(([name, n]) => (
              <div key={name} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{name}</dt>
                <dd className="tnum text-foreground">{n}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
        <NoteCard
          variant="plate"
          title="Still unassigned"
          body="Distributed System Security has no lecturer on the timetable yet. Confirm with the department before your first Thursday class."
        />
      </section>

      {/* ---------- Take it with you ---------- */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-xl font-semibold text-foreground">Take it with you</h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Both are generated from the same published timetable, so neither can
          drift from the page above.
        </p>
        <div className="mt-6">
          <TakeawayPills />
        </div>
      </section>
    </div>
  );
}

function NoteCard({
  variant,
  title,
  body,
  children,
}: {
  variant: "calendar" | "plan" | "plate";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className="card-lift flex flex-col rounded-lg border border-border bg-surface p-6">
      <div className="mb-7 w-28">
        <NoteArt variant={variant} />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </Reveal>
  );
}