"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ACADEMIC_CALENDAR_EVENTS, CATEGORY_STYLE, isToday } from "@/lib/calendar";
import type { CalendarEvent, Category } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import SessionScrubber from "@/components/SessionScrubber";

type Dated = CalendarEvent & { start: Date };

const DATED = ACADEMIC_CALENDAR_EVENTS.filter(
  (e): e is Dated => e.start !== null
).sort((a, b) => a.start.getTime() - b.start.getTime());

const CATEGORIES = Object.keys(CATEGORY_STYLE) as Category[];

function fmt(d: Date) {
  return d.toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Short weekday, e.g. "Mon". The full name is noise in a dense list. */
function shortDay(day: string) {
  return day === "TBD" ? "TBD" : day.slice(0, 3);
}

export default function TimelineInteractive({ todayStamp }: { todayStamp: number }) {
  const now = React.useMemo(() => new Date(todayStamp), [todayStamp]);
  const [filter, setFilter] = React.useState<Category | "All">("All");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const visible = React.useMemo(
    () => (filter === "All" ? DATED : DATED.filter((e) => e.category === filter)),
    [filter]
  );

  /**
   * The rail describes whatever is currently listed, not the whole session.
   * Filtering to exams turns it into an exam calendar, which is the thing a
   * student actually wants to scrub. Spacing is even by index because the
   * session front-loads heavily: fourteen events fall in the first fortnight,
   * so a date-true rail would leave most of its length empty.
   */
  const points = React.useMemo(
    () =>
      visible.map((e, i) => ({
        id: `${e.month}|${e.activity}`,
        label: `${fmt(e.start)} · ${e.activity}`,
        month: e.month,
        at: visible.length === 1 ? 0 : i / (visible.length - 1),
      })),
    [visible]
  );

  const todayIdx = React.useMemo(() => {
    const t = now.getTime();
    let idx = visible.length > 0 ? 0 : -1;
    visible.forEach((e, i) => {
      if (e.start.getTime() <= t) idx = i;
    });
    return idx;
  }, [visible, now]);

  // Keep the focused row in view as the handle moves.
  React.useEffect(() => {
    if (!activeId) return;
    const el = document.querySelector<HTMLElement>(
      `[data-event="${CSS.escape(activeId)}"]`
    );
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [activeId]);

  const groups = React.useMemo(() => {
    const out: { month: string; events: Dated[] }[] = [];
    for (const e of visible) {
      const last = out[out.length - 1];
      if (last && last.month === e.month) last.events.push(e);
      else out.push({ month: e.month, events: [e] });
    }
    return out;
  }, [visible]);

  const counts = React.useMemo(() => {
    const map = new Map<Category, number>();
    for (const c of CATEGORIES) map.set(c, DATED.filter((e) => e.category === c).length);
    return map;
  }, []);

  return (
    <section>
      {/* Remounting on filter change resets the handle to the new list's
          position instead of leaving it pointing past the last row. */}
      <div className="print-hide mb-10">
        <SessionScrubber
          key={filter}
          points={points}
          todayIndex={Math.max(0, todayIdx)}
          onActiveChange={setActiveId}
        />
      </div>

      {/* ---------- Filter ---------- */}
      <div className="print-hide mb-8 flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter === "All"}
          onClick={() => setFilter("All")}
          label="All"
          count={DATED.length}
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={c}
            count={counts.get(c) ?? 0}
            dot={CATEGORY_STYLE[c].dot}
          />
        ))}
      </div>

      {/* ---------- List ---------- */}
      {groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <p className="text-[15px] text-foreground">Nothing in this category</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted-foreground">
            The Registrar has not published {filter.toLowerCase()} dates for this
            session. Try another category, or view the full calendar.
          </p>
          <button
            onClick={() => setFilter("All")}
            className="pressable mt-5 rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Show all {DATED.length} events
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => {
            const hasToday = group.events.some((e) => isToday(e, now));
            const done = group.events.every(
              (e) => e.start.getTime() < now.getTime()
            );
            return (
              <div key={group.month}>
                {/* Sticky so the month stays put while its rows scroll past. */}
                <div className="sticky top-16 z-10 -mx-1 mb-3 flex items-center gap-3 bg-background/90 px-1 py-2 backdrop-blur-sm">
                  <h2
                    className={cn(
                      "text-[13px] font-bold uppercase tracking-[0.14em]",
                      hasToday ? "text-accent" : "text-muted-foreground"
                    )}
                  >
                    {group.month}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-border"
                  />
                  {hasToday && (
                    <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
                      This month
                    </span>
                  )}
                  {done && !hasToday && (
                    <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
                      Done
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5">
                  {group.events.map((e) => {
                    const style = CATEGORY_STYLE[e.category];
                    const past = e.start.getTime() < now.getTime();
                    const today = isToday(e, now);
                    const id = `${e.month}|${e.activity}`;
                    const isActive = activeId === id;

                    return (
                      <li
                        key={id}
                        data-event={id}
                        className={cn(
                          "event-row relative flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border px-4 py-3",
                          isActive && "event-focused",
                          today
                            ? cn(style.border, "bg-surface-raised")
                            : past
                              ? "border-transparent opacity-55"
                              : "border-transparent hover:border-border hover:bg-surface"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full",
                            style.dot,
                            past ? "opacity-40" : "opacity-100"
                          )}
                        />

                        <span className="tnum w-11 shrink-0 text-[12px] font-medium text-muted-foreground">
                          {shortDay(e.day)}
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

                        <span className="flex w-[11rem] shrink-0 items-center justify-end gap-2.5">
                          {today ? (
                            <span className="text-[12px] font-semibold text-accent">
                              Today
                            </span>
                          ) : past ? (
                            <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
                              Done
                            </span>
                          ) : null}
                          <span className="tnum text-[12px] text-muted-foreground">
                            {e.date === "TBD" ? "TBD" : e.date}
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
      )}

      {/* ---------- Footer ---------- */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <p className="max-w-lg text-[13px] leading-relaxed text-muted-foreground">
          Exam dates and senate meetings are set by the Registrar. This page
          reads from the published Unified Academic Calendar and does not
          estimate anything the department has not confirmed.
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

function FilterChip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "pressable inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-accent/50 bg-accent/12 text-foreground"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
      )}
    >
      {dot && (
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dot)} />
      )}
      {label}
      <span className="tnum text-[11px] text-muted">{count}</span>
    </button>
  );
}
