"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  ACADEMIC_CALENDAR_EVENTS,
  CATEGORY_STYLE,
  sessionStats,
  isToday,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import SessionScrubber from "@/components/SessionScrubber";

/** One row per dated event, flattened out of the month grouping. */
const DATED = ACADEMIC_CALENDAR_EVENTS.filter((e) => e.start) as (CalendarEvent & {
  start: Date;
})[];

function fmt(d: Date) {
  return d.toLocaleString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TimelineInteractive({ todayStamp }: { todayStamp: number }) {
  const now = useMemoNow(todayStamp);
  const stats = sessionStats(now);

  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Points across the session, one per event.
  // Spaced evenly by index rather than by date: fourteen events land in the
  // first fortnight, so a date-true rail leaves most of its length empty and
  // makes the early targets impossible to hit. The date is shown in the
  // readout instead, where it is readable.
  const points = React.useMemo(() => {
    if (DATED.length === 0) return [];
    return DATED.map((e, i) => ({
      id: e.activity + e.date,
      label: `${fmt(e.start)} · ${e.activity}`,
      at: DATED.length === 1 ? 0 : i / (DATED.length - 1),
    }));
  }, []);

  const todayIdx = React.useMemo(() => {
    const t = now.getTime();
    let idx = 0;
    DATED.forEach((e, i) => {
      if (e.start.getTime() <= t) idx = i;
    });
    return idx;
  }, [now]);

  // Scroll a date into view when the scrubber lands on it.
  React.useEffect(() => {
    if (!activeId) return;
    const el = document.querySelector<HTMLElement>(`[data-event="${CSS.escape(activeId)}"]`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [activeId]);

  const activeIndex = points.findIndex((p) => p.id === activeId);

  return (
    <section>
      {/* Interactive scrubber */}
      <div className="mb-14">
        <SessionScrubber
          points={points}
          todayIndex={todayIdx}
          onActiveChange={setActiveId}
        />
      </div>

      {/* Month groups of events */}
      <div className="space-y-2">
        {monthGroups(DATED).map((group) => {
          const hasToday = group.events.some((e) => isToday(e, now));
          return (
            <div key={group.month} className="pt-8 first:pt-0">
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className={cn(
                    "text-[13px] font-bold uppercase tracking-[0.14em]",
                    hasToday ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {group.month}
                </h2>
                {hasToday && (
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
                    This month
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                {group.events.map((e) => {
                  const style = CATEGORY_STYLE[e.category];
                  const past = e.start.getTime() < now.getTime();
                  const today = isToday(e, now);
                  const id = e.activity + e.date;
                  const isActive = activeId === id;

                  return (
                    <li
                      key={id}
                      data-event={id}
                      className={cn(
                        "event-row group relative flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border px-4 py-3",
                        isActive && "event-focused",
                        today
                          ? cn(style.border, "bg-surface-raised")
                          : past
                            ? "border-transparent opacity-60"
                            : "border-transparent hover:border-border hover:bg-surface"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full",
                          style.dot,
                          past ? "opacity-40" : "opacity-100"
                        )}
                      />
                      <span className="tnum w-[4.5rem] shrink-0 text-[12px] font-medium text-muted-foreground">
                        {e.day}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[14px] leading-snug",
                          past ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {e.activity}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
                          style.chip,
                          past && "opacity-70"
                        )}
                      >
                        {e.category}
                      </span>
                      <span className="flex w-[13rem] shrink-0 items-center justify-end gap-2.5">
                        {today ? (
                          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Today
                          </span>
                        ) : past ? (
                          <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
                            Done
                          </span>
                        ) : null}
                        <span className="tnum text-[12px] text-muted-foreground">
                          {e.date}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <p className="text-[13px] text-muted-foreground">
          Exam dates and senate meetings are set by the Registrar. This page reads from
          the published calendar.
        </p>
        <Link
          href="/timetable"
          className="pressable inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Weekly timetable
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function useMemoNow(stamp: number) {
  return React.useMemo(() => new Date(stamp), [stamp]);
}

function monthGroups(events: (CalendarEvent & { start: Date })[]) {
  const groups: { month: string; events: (CalendarEvent & { start: Date })[] }[] = [];
  for (const e of events) {
    const last = groups[groups.length - 1];
    if (last && last.month === e.month) last.events.push(e);
    else groups.push({ month: e.month, events: [e] });
  }
  return groups;
}