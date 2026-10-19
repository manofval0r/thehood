import Link from "next/link";
import { Download } from "lucide-react";
import { COURSES, resourceUrl, TIMETABLE_PDF } from "@/lib/resources";
import { SCHEDULE, type ScheduledCourse } from "@/lib/schedule";
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

export default function TimetablePage() {
  const totalUnits = COURSES.reduce((s, c) => s + c.units, 0);

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
              className="print-hide pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Download size={15} />
              Download PDF
            </a>
            <PrintButton />
          </div>
        </div>
      </section>

      <TimetableBoard
        byDay={ORDERED}
        totalUnits={totalUnits}
        courseCount={COURSES.length}
        weeklySessions={WEEKLY_SESSIONS}
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