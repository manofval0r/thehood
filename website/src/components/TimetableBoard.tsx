"use client";

import * as React from "react";
import Link from "next/link";
import { Fragment } from "react";
import { LayoutGrid, Rows3, MapPin, User, Clock } from "lucide-react";
import { TableFrame, DataTable, Thead, Th, Tr, Td, DayGroup } from "@/components/ui/table";
import { SlotStatus, TodayHeading } from "@/components/TodayBadge";
import AppleCard from "@/components/AppleCard";
import type { ScheduledCourse } from "@/lib/schedule";
import { formatRange } from "@/lib/schedule";
import { breakFor, breaksIn } from "@/lib/breaks";
import type { BreakSetting } from "@/lib/breaks";
import { cn } from "@/lib/utils";

/**
 * The timetable, two ways.
 *
 * Grid is the honest view: a week of teaching is a lookup, and a lookup wants
 * aligned columns you can scan down.
 *
 * Perspective is the same data arranged the way the academic calendar is
 * arranged. There, distance from the thing being looked at drives opacity and
 * scale, so the row the rail points at is the one at full strength and the
 * rest recede. Borrowed here for the same reason it works there: a week of
 * eleven sessions is not equally relevant at every moment, and the class that
 * is running or next should not have to compete with the ones three days away.
 *
 * The two views are not ranked. The table stays the default, because it is
 * faster to read and prints correctly.
 */

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type View = "grid" | "perspective";

const VIEW_KEY = "cybersec-300l-timetable-view";

export default function TimetableBoard({
  byDay,
  totalUnits,
  courseCount,
  weeklySessions,
  breaks,
}: {
  byDay: Record<string, ScheduledCourse[]>;
  totalUnits: number;
  courseCount: number;
  weeklySessions: number;
  /** The length of the break in each lecture. */
  breaks: BreakSetting[];
}) {
  const [view, setView] = React.useState<View>("grid");

  // Restored after mount rather than read during render: this is a server
  // component tree, so a stored preference cannot exist at first paint and
  // guessing here would flash the wrong view at every reader who chose one.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_KEY);
      if (stored === "grid" || stored === "perspective") setView(stored);
    } catch {
      // Storage unavailable. The default view is fine.
    }
  }, []);

  const choose = (next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Preference is a convenience, not a requirement.
    }
  };

  const days = DAY_ORDER.filter((d) => (byDay[d]?.length ?? 0) > 0);

  return (
    <section className="rise" style={{ animationDelay: "80ms" }}>
      <div className="print-hide mb-5 flex flex-wrap items-center justify-between gap-4">
        <ViewSlicer view={view} onChange={choose} />
        <p className="text-[12.5px] text-muted-foreground">
            {view === "grid"
              ? `${weeklySessions} weekly sessions across ${courseCount} courses, in aligned columns.`
              : "Sorted by distance from now, so what is running sits forward."}
          </p>
      </div>

      {/* The table is also what gets printed, whichever view is on screen.
          Switching to perspective must not change what comes out of the
          printer, so the grid stays mounted and is only hidden visually. */}
      <div className={cn(view === "grid" ? "block" : "hidden print:block")}>
        <TableFrame>
          <DataTable>
            <Thead>
              {/* Sized for the widest thing that can land in each: the code, an
                  extra-session marker and a status chip at once. Widening the
                  column is the fix; letting it wrap is not, because a wrapped
                  code makes the row taller and the grid stops lining up. */}
              <Th width="8.5rem">Time</Th>
              <Th width="12rem">Code</Th>
              <Th>Course</Th>
              <Th width="5rem" align="right">
                Units
              </Th>
              <Th width="9.5rem">Venue</Th>
              <Th width="9.5rem">Lecturer</Th>
            </Thead>
            <tbody>
              {days.map((day) => {
                const slots = byDay[day];
                return (
                  <Fragment key={day}>
                    <DayGroup count={slots.length}>
                      <span className="inline-flex items-center">
                        {day}
                        <TodayHeading dayIndex={slots[0].dayIndex} />
                      </span>
                    </DayGroup>
                    {slots.map((s, i) => (
                      <Fragment key={`${day}-${s.code}-${s.startMin}-${i}`}>
                        <Tr>
                          <Td
                            numeric
                            className="whitespace-nowrap font-medium text-foreground"
                          >
                            {formatRange(s.startMin, s.endMin)}
                          </Td>
                          <Td className="whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Link
                                href={`/courses/${s.slug}`}
                                className="pressable rounded font-mono text-[12px] font-bold text-accent underline-offset-4 hover:underline"
                              >
                                {s.code}
                              </Link>
                              {s.isExtraSession && (
                                <span
                                  title="An additional weekly meeting of this course"
                                  className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground"
                                >
                                  +1
                                </span>
                              )}
                              <SlotStatus
                                dayIndex={s.dayIndex}
                                startMin={s.startMin}
                                endMin={s.endMin}
                              />
                            </span>
                          </Td>
                          <Td strong className="min-w-[18rem]">
                            {s.title}
                          </Td>
                          <Td numeric align="right">
                            {s.units}
                          </Td>
                          <Td className="whitespace-nowrap">{s.venue}</Td>
                          <Td className="whitespace-nowrap">{s.lecturer}</Td>
                        </Tr>

                        {/* The breaks. They are not classes, so they get
                            their own thin rows under the lecture they belong
                            to, and a student reading the week can see where
                            the hour actually turns over. */}
                        {breaksIn(
                          s.startMin,
                          s.endMin,
                          breakFor(
                            breaks,
                            s.code,
                            s.dayIndex,
                            s.startMin
                          )
                        ).map((b) => (
                          <Tr key={`${day}-${s.code}-break-${b.from}`}>
                            <Td
                              numeric
                              className="whitespace-nowrap font-mono text-[11.5px] text-muted"
                            >
                              {formatRange(b.from, b.to)}
                            </Td>
                            <Td className="whitespace-nowrap">
                              <span className="rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                                Break
                              </span>
                            </Td>
                            <Td className="min-w-[18rem] text-[12.5px] text-muted">
                              {b.to - b.from} minute break
                            </Td>
                            <Td />
                            <Td />
                            <Td />
                          </Tr>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
              <tr className="border-t border-border-strong bg-surface-raised">
                <td
                  colSpan={3}
                  className="px-4 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-foreground"
                >
                  Total registered
                </td>
                <Td numeric align="right" strong>
                  {totalUnits}
                </Td>
                <td
                  colSpan={2}
                  className="px-4 py-3.5 text-[12px] text-muted-foreground"
                >
                  units across {courseCount} courses
                </td>
              </tr>
            </tbody>
          </DataTable>
        </TableFrame>
      </div>

      {view === "perspective" && (
        <div className="print-hidden">
          <PerspectiveView byDay={byDay} days={days} />
          <p className="mt-6 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="tnum font-semibold text-foreground">{totalUnits}</span>
            units across {courseCount} courses.
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* the slicer                                                          */
/* ------------------------------------------------------------------ */

function ViewSlicer({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = React.useState({ x: 0, w: 0, ready: false });

  /**
   * The thumb is measured from the buttons rather than derived from a
   * fraction of the container.
   *
   * Both labels are different lengths, so a thumb sized as a fixed fraction
   * covers "Grid" and clips "Perspective". Measuring the actual button means
   * the pill always covers its label and its icon, whatever the text is, and
   * a longer view name cannot break it.
   */
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-view="${view}"]`);
    if (!el) return;
    setThumb({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
  }, [view]);

  const options: Array<{ id: View; label: string; icon: typeof Rows3 }> = [
    { id: "grid", label: "Grid", icon: Rows3 },
    { id: "perspective", label: "Perspective", icon: LayoutGrid },
  ];

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Timetable view"
      className="relative inline-flex items-center rounded-full border border-border bg-surface p-1"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full",
          "bg-accent/14 ring-1 ring-inset ring-accent/30",
          // A critically damped ease rather than a linear or bouncy curve: the
          // thumb is being thrown between two places, not flicked at one.
          "transition-[transform,width] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          thumb.ready ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: thumb.w,
          transform: `translate3d(${thumb.x}px, 0, 0)`,
        }}
      />
      {options.map((o) => {
        const active = o.id === view;
        return (
          <button
            key={o.id}
            data-view={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "pressable relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <o.icon
              size={14}
              className={cn(
                "transition-colors duration-300",
                active ? "text-accent" : "text-muted-foreground"
              )}
            />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the perspective view                                                */
/* ------------------------------------------------------------------ */

/**
 * How far away a session is, in hours, from the class that matters now.
 *
 * Midnight on a quiet day is not the same distance as midnight on a busy one,
 * so this compares against the nearest session rather than against the clock.
 * The result is scaled into the same --d unit the calendar uses, which is what
 * lets the two views share one depth language.
 */
function useDistances(byDay: Record<string, ScheduledCourse[]>) {
  return React.useMemo(() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();

    /** Minutes from now until this slot, negative once it has passed. */
    const relative = (s: ScheduledCourse) => {
      let dayDelta = s.dayIndex - today;
      if (dayDelta < -6) dayDelta += 7;
      if (dayDelta > 6) dayDelta -= 7;
      return dayDelta * 1440 + (s.startMin - nowMin);
    };

    const all = Object.values(byDay).flat();
    const closest = all.reduce(
      (best, s) => Math.min(best, Math.abs(relative(s))),
      Infinity
    );
    const span = Math.max(closest, 240); // never tighter than four hours

    const distance = new Map<ScheduledCourse, number>();
    for (const s of all) {
      distance.set(s, Math.abs(relative(s)) / span);
    }
    return distance;
  }, [byDay]);
}

function PerspectiveView({
  byDay,
  days,
}: {
  byDay: Record<string, ScheduledCourse[]>;
  days: string[];
}) {
  const distance = useDistances(byDay);
  const [hovered, setHovered] = React.useState<string | null>(null);

  const flat = React.useMemo(
    () =>
      days
        .map((d) => byDay[d])
        .flat()
        .sort((a, b) => (distance.get(a) ?? 0) - (distance.get(b) ?? 0)),
    [days, byDay, distance]
  );

  /**
   * Where a session sits relative to this moment, in words.
   *
   * Sorting by distance alone gives the right order but no way to read it: a
   * number that means "in four hours" and one that means "in four days" sort
   * identically. Naming the gap is what makes a receding list usable rather
   * than decorative.
   */
  const bandOf = (s: ScheduledCourse) => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (s.dayIndex === now.getDay()) {
      if (nowMin >= s.startMin && nowMin < s.endMin) return "running";
      if (s.startMin > nowMin) return "today";
      return "past";
    }
    let delta = s.dayIndex - now.getDay();
    if (delta < 0) delta += 7;
    if (delta === 1) return "tomorrow";
    if (delta <= 3) return "soon";
    return "later";
  };

  const BAND_LABEL: Record<string, string> = {
    running: "Running now",
    today: "Later today",
    tomorrow: "Tomorrow",
    soon: "This week",
    later: "Later in the week",
    past: "Already finished today",
  };
  const BAND_ORDER = [
    "running",
    "today",
    "tomorrow",
    "soon",
    "later",
    "past",
  ];

  const bands = BAND_ORDER.map((id) => ({
    id,
    label: BAND_LABEL[id],
    slots: flat.filter((s) => bandOf(s) === id),
  })).filter((b) => b.slots.length > 0);

  const nearest = flat[0];

  return (
    <div className="relative">
      {/*
        The spine. A 1px axis the cards hang off, with a mark at the position
        of now, so the depth is something the eye can locate rather than only
        infer from how faint something has gone.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-[7px] top-3 w-px bg-border"
      />

      <div className="space-y-8">
        {bands.map((band) => {
          // The mark sits at the top of whichever band contains "now".
          const isNowBand = band.id === "running" || band.id === "today";

          return (
            <section key={band.id} className="relative">
              <div className="relative flex items-center gap-3 pb-3 pl-7">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-2",
                    isNowBand ? "border-accent bg-accent" : "border-border bg-background"
                  )}
                />
                <h3
                  className={cn(
                    "text-[13px] font-semibold tracking-tight",
                    isNowBand ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {band.label}
                </h3>
                <span className="tnum text-[12px] text-muted">
                  {band.slots.length}
                </span>
              </div>

              <div className="space-y-2.5 pl-7">
                {band.slots.map((s) => {
                  const key = `${s.dayName}-${s.startMin}-${s.code}`;
                  const d = distance.get(s) ?? 0;
                  const isNearest = s === nearest;
                  const isRunning = band.id === "running";

                  return (
                    <AppleCard key={key} maxTilt={4} className="h-full">
                      <Link
                        href={`/courses/${s.slug}`}
                        onMouseEnter={() => setHovered(key)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(key)}
                        onBlur={() => setHovered(null)}
                        /* The class computes opacity and scale from --d, so
                           this element sets a number rather than a style. */
                        data-nearest={isNearest ? "true" : undefined}
                        style={
                          {
                            "--d": d.toFixed(2),
                            "--hover-dim": hovered && hovered !== key ? "0.42" : "1",
                          } as React.CSSProperties
                        }
                        className={cn(
                          // settle-move, not settle: an entrance that touches
                          // opacity would, once filled, pin every row at full
                          // strength and the depth fade would have nothing to
                          // do.
                          "depth-row card-tilt settle-move group relative block rounded-lg border border-border bg-surface transition-colors",
                          "hover:border-border-strong focus-visible:border-border-strong",
                          isNearest ? "px-6 py-5" : "px-5 py-4"
                        )}
                      >
                        <span className="card-cast" aria-hidden="true" />
                        <span className="card-bevel" aria-hidden="true" />

                        <div
                          className={cn(
                            "card-depth flex flex-wrap items-center gap-x-4 gap-y-2",
                            isNearest ? "gap-y-3" : "gap-y-2"
                          )}
                        >
                          {/* When, set apart: it is the thing being scanned
                              for, and it is what orders the whole view. */}
                          <span className="w-full shrink-0 sm:w-[10rem]">
                            <span
                              className={cn(
                                "tnum block font-mono font-semibold",
                                isNearest ? "text-[14px]" : "text-[12.5px]",
                                isRunning
                                  ? "text-accent"
                                  : isNearest
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              )}
                            >
                              {s.dayName.slice(0, 3)} {formatRange(s.startMin, s.endMin)}
                            </span>
                            {!isNearest && (
                              <span className="block text-[10.5px] text-muted">
                                {s.venue}
                              </span>
                            )}
                          </span>

                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="shrink-0 rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[11px] font-bold text-accent">
                              {s.code}
                            </span>
                            {s.isExtraSession && (
                              <span
                                title="An additional weekly meeting of this course"
                                className="shrink-0 rounded bg-surface-hover px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground"
                              >
                                +1
                              </span>
                            )}
                            <span
                              className={cn(
                                "truncate",
                                isNearest
                                  ? "text-[16px] font-medium"
                                  : "text-[14px] font-medium",
                                "text-foreground"
                              )}
                            >
                              {s.title}
                            </span>
                          </span>

                          <span
                            className={cn(
                              "flex shrink-0 items-center gap-4",
                              isNearest
                                ? "text-[12.5px] text-muted-foreground"
                                : "text-[12px] text-muted-foreground"
                            )}
                          >
                            <span className="tnum">{s.units} units</span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <MapPin size={12} className="opacity-60" />
                              {s.venue}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <User size={12} className="opacity-60" />
                              {s.lecturer}
                            </span>
                          </span>
                        </div>

                        {/* Status sits on the row rather than in a column, so
                            this view has no cells to misalign when a chip
                            appears. */}
                        <span className="card-depth mt-2.5 flex items-center gap-2">
                          <SlotStatus
                            dayIndex={s.dayIndex}
                            startMin={s.startMin}
                            endMin={s.endMin}
                          />
                          {isNearest && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock size={11} className="opacity-60" />
                              {isRunning ? "you are here" : "closest to now"}
                            </span>
                          )}
                        </span>
                      </Link>
                    </AppleCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
