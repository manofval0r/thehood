"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ACADEMIC_CALENDAR_EVENTS, CATEGORY_STYLE, isToday } from "@/lib/calendar";
import type { CalendarEvent, Category } from "@/lib/calendar";
import { todayIso } from "@/lib/session-dates";
import { cn } from "@/lib/utils";
import SessionRail, { FOCAL } from "@/components/SessionRail";

type Dated = CalendarEvent & { start: Date };

const DATED = ACADEMIC_CALENDAR_EVENTS.filter(
  (e): e is Dated => e.start !== null
).sort((a, b) => a.start.getTime() - b.start.getTime());

const CATEGORIES = Object.keys(CATEGORY_STYLE) as Category[];

/** Rows further than this from the rail are given a flat, fully faded value. */
const WINDOW = 14;

/** One row of the list, and where it sits in it. */
interface Ordered {
  event: Dated;
  /** The position in the list as it is shown. */
  flat: number;
  /** Which half of the session it belongs to. */
  part: "now" | "earlier";
}

/**
 * Months, in the order they are shown.
 *
 * The list is cut at today, so the months come in two runs: the ones still
 * to come, and the ones already gone. Each run keeps its own month
 * headings, because a single run of months that starts in October and ends
 * in September reads like a mistake.
 */
function groupByMonth(rows: Ordered[]) {
  const out: { month: string; rows: Ordered[] }[] = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (last && last.month === row.event.month) last.rows.push(row);
    else out.push({ month: row.event.month, rows: [row] });
  }
  return out;
}

function fmt(d: Date) {
  return d.toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDay(day: string) {
  return day === "TBD" ? "TBD" : day.slice(0, 3);
}

export default function TimelineInteractive({ todayStamp }: { todayStamp: number }) {
  const now = React.useMemo(() => new Date(todayStamp), [todayStamp]);
  const [filter, setFilter] = React.useState<Category | "All">("All");
  const [activeIdx, setActiveIdx] = React.useState(0);

  const listRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const offsets = React.useRef<number[]>([]);
  const draggingRef = React.useRef(false);
  const programmatic = React.useRef(false);

  const visible = React.useMemo(
    () => (filter === "All" ? DATED : DATED.filter((e) => e.category === filter)),
    [filter]
  );

  /* ---------------- where the list begins ---------------- */

  /**
   * The cut, in days.
   *
   * Today, as the day the reader is on rather than the day the server is
   * on, because the two differ for most of the evening.
   */
  const today = React.useMemo(() => todayIso(now.getTime()), [now]);

  /**
   * Where the session's earlier part ends and the rest of it begins.
   *
   * The calendar opens on today, not on the first day of the session. A
   * student who opens the academic calendar wants to know what is happening
   * now and what is next; the weeks before today are a record of what has
   * already happened, not an agenda. So everything from today onwards is
   * listed first, and the earlier part of the session goes below it under a
   * heading of its own.
   *
   * The cut is a clean prefix because the list is sorted by date and
   * nothing in the published calendar runs from before today into after it:
   * the Registrar's spans end on the day they end.
   */
  const splitIdx = React.useMemo(() => {
    const i = visible.findIndex((e) => e.iso !== null && e.iso >= today);
    return i === -1 ? visible.length : i;
  }, [visible, today]);

  /**
   * The list in the order it is shown: now and next, then the earlier part.
   *
   * The flat index is the position in this list, and the rail, the fading
   * and the scroll all work in it, so the rail's "today" mark is the row
   * for today wherever it ended up.
   */
  const ordered = React.useMemo(() => {
    const fromToday = visible.slice(splitIdx);
    const earlier = visible.slice(0, splitIdx);
    const out: Ordered[] = [];
    fromToday.forEach((event, i) =>
      out.push({ event, flat: i, part: "now" })
    );
    earlier.forEach((event, i) =>
      out.push({ event, flat: fromToday.length + i, part: "earlier" })
    );
    return out;
  }, [visible, splitIdx]);

  /** The row the rail marks as today. */
  const todayRow = React.useMemo(() => {
    const i = ordered.findIndex((o) => isToday(o.event, now));
    if (i >= 0) return ordered[i].flat;
    // No row for today, so the mark goes on the first one that is still to
    // come, which is the nearest thing to now that the calendar has.
    return splitIdx < ordered.length ? ordered[splitIdx].flat : 0;
  }, [ordered, now, splitIdx]);

  /* ---------------- measure row positions ---------------- */

  /**
   * Row positions are cached in DOCUMENT space (viewport Y plus scrollY).
   *
   * `offsetTop` is relative to whatever ancestor happens to be positioned,
   * which here is not the list, so it was being compared against a page-space
   * number and the focal point drifted off the list as the reader scrolled.
   * getBoundingClientRect plus scrollY is the same space regardless of
   * which ancestor is the offset parent.
   */
  const measure = React.useCallback(() => {
    const y = window.scrollY;
    const next: number[] = [];
    for (let i = 0; i < visible.length; i++) {
      const el = rowRefs.current[i];
      next.push(el ? el.getBoundingClientRect().top + y : 0);
    }
    offsets.current = next;
  }, [visible.length]);

  React.useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  /** The page-space Y the focused row should sit at. */
  const focalY = React.useCallback(
    () => window.scrollY + window.innerHeight * FOCAL,
    []
  );

  /** Put a row at the focal line. Instant: this is the drag's own motion. */
  const scrollRowToFocal = React.useCallback(
    (index: number) => {
      const el = rowRefs.current[index];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const docTop = r.top + window.scrollY;
      const target = docTop + r.height / 2 - window.innerHeight * FOCAL;
      window.scrollTo(0, Math.max(0, target));
    },
    []
  );

  /* ---------------- scroll -> active ---------------- */

  /**
   * Rows are painted with a signed distance from the active one, so CSS can
   * fade past and future rows at different rates without a React render. Only
   * rows inside the window are written, and only when the active row actually
   * changed, which is what keeps this free of jitter.
   */
  const painted = React.useRef(-1);
  const paintedRows = React.useRef<Set<number>>(new Set());

  const paint = React.useCallback((active: number) => {
    if (active === painted.current) return;
    painted.current = active;

    for (const i of paintedRows.current) {
      const el = rowRefs.current[i];
      if (el) {
        el.style.removeProperty("--d");
        el.removeAttribute("data-focus");
      }
    }
    paintedRows.current.clear();

    const lo = Math.max(0, active - WINDOW);
    const hi = Math.min(visible.length, active + WINDOW + 1);
    for (let i = lo; i < hi; i++) {
      const el = rowRefs.current[i];
      if (!el) continue;
      el.style.setProperty("--d", String(Math.abs(i - active)));
      // Future rows fade faster than past ones, so the eye is drawn forward.
      el.style.setProperty("--dim", i >= active ? "0.055" : "0.04");
      if (i === active) el.setAttribute("data-focus", "true");
      paintedRows.current.add(i);
    }
  }, [visible.length]);

  React.useEffect(() => {
    painted.current = -1;
    paintedRows.current.clear();
  }, [filter]);

  const computeActiveFromScroll = React.useCallback(() => {
    if (visible.length === 0) return 0;
    const focal = focalY();
    const off = offsets.current;
    if (off.length === 0) return 0;

    // Positions are cached, but the reader may have scrolled past the point
    // where they were taken. If the nearest cached row is further than a
    // screen away, the cache is stale, so re-measure before trusting it.
    const nearest = off.reduce(
      (best, y, i) =>
        Math.abs(y - focal) < Math.abs(off[best] - focal) ? i : best,
      0
    );
    if (Math.abs(off[nearest] - focal) > window.innerHeight * 1.5) {
      measure();
      const refreshed = offsets.current;
      return refreshed.reduce(
        (best, y, i) =>
          Math.abs(y - focal) < Math.abs(refreshed[best] - focal) ? i : best,
        0
      );
    }
    return nearest;
  }, [visible.length, focalY, measure]);

  React.useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // While dragging, the rail is the source of truth and driving scroll
        // back into activeIdx would fight the pointer.
        if (draggingRef.current) return;
        const a = computeActiveFromScroll();
        if (a !== activeIdx) setActiveIdx(a);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [computeActiveFromScroll, activeIdx]);

  React.useEffect(() => {
    paint(activeIdx);
  }, [activeIdx, paint]);

  /* ---------------- rail -> scroll, 1:1 ---------------- */

  const scrub = React.useCallback(
    (index: number, dragging: boolean) => {
      draggingRef.current = dragging;
      const clamped = Math.max(0, Math.min(visible.length - 1, index));
      setActiveIdx(clamped);

      // 1:1 with the pointer. No smooth behaviour: a fixed-duration animation
      // lags the pointer and then snaps when released.
      scrollRowToFocal(clamped);

      if (!dragging) {
        window.requestAnimationFrame(() => {
          programmatic.current = false;
          draggingRef.current = false;
        });
      }
    },
    [visible.length, scrollRowToFocal]
  );

  const stopAutoScroll = React.useCallback(() => {}, []);

  /* ---------------- the groups ---------------- */

  const groupsNow = React.useMemo(
    () => groupByMonth(ordered.filter((o) => o.part === "now")),
    [ordered]
  );

  const groupsEarlier = React.useMemo(
    () => groupByMonth(ordered.filter((o) => o.part === "earlier")),
    [ordered]
  );

  const counts = React.useMemo(() => {
    const map = new Map<Category, number>();
    for (const c of CATEGORIES) map.set(c, DATED.filter((e) => e.category === c).length);
    return map;
  }, []);

  /**
   * One month of the list.
   *
   * The same shape for both halves of the session, so the earlier part of
   * the session reads exactly like the rest of it and only sits lower down.
   */
  const monthBlock = (group: { month: string; rows: Ordered[] }) => {
    const hasToday = group.rows.some((r) => isToday(r.event, now));
    const done = group.rows.every((r) => r.event.start.getTime() < now.getTime());
    return (
      <div key={group.month}>
        <div className="sticky top-16 z-20 -mx-1 mb-3 flex items-center gap-3 bg-background/90 px-1 py-2 backdrop-blur-sm">
          <h2
            className={cn(
              "text-[13px] font-bold uppercase tracking-[0.14em]",
              hasToday ? "text-accent" : "text-muted-foreground"
            )}
          >
            {group.month}
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          {hasToday && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-foreground">
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
          {group.rows.map((row) => {
            const e = row.event;
            const style = CATEGORY_STYLE[e.category];
            const past = e.start.getTime() < now.getTime();
            const today = isToday(e, now);
            const index = row.flat;

            return (
              <li
                key={`${e.month}|${e.activity}|${index}`}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                data-today={today ? "true" : undefined}
                className={cn(
                  "event-row relative flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border px-4 py-3",
                  today
                    ? cn(style.border, "bg-surface-raised")
                    : "border-transparent"
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
  };

  return (
    <section>
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

      {ordered.length === 0 ? (
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
        <div className="lg:grid lg:grid-cols-[3.5rem_minmax(0,1fr)] lg:gap-8">
          {/* ---------- Sticky rail ---------- */}
          <div className="print-hide hidden lg:block">
            <div className="sticky top-24 flex h-[calc(100vh-7rem)] items-center">
              <SessionRail
                count={ordered.length}
                activeIndex={activeIdx}
                todayIndex={todayRow}
                onScrub={scrub}
                onDragStart={stopAutoScroll}
              />
            </div>
          </div>

          {/* ---------- List ---------- */}
          <div ref={listRef} className="space-y-10">
            {/* ---------- Now and next ---------- */}
            {groupsNow.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface px-5 py-6 text-[13.5px] leading-relaxed text-muted-foreground">
                Nothing in {filter === "All" ? "the calendar" : filter.toLowerCase()} from today
                onwards. What has already been is below.
              </p>
            ) : (
              groupsNow.map(monthBlock)
            )}

            {/* ---------- The earlier part of the session ---------- */}
            {groupsEarlier.length > 0 && (
              <div className="border-t border-border pt-10">
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Earlier in this session
                  </h2>
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
                    {splitIdx} events
                  </span>
                </div>
                <div className="space-y-10">{groupsEarlier.map(monthBlock)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Footer ---------- */}
      <div className="mt-20 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <p className="max-w-lg text-[13px] leading-relaxed text-muted-foreground">
          Exam dates and senate meetings are set by the Registrar. This page
          reads from the published Unified Academic Calendar and does not
          estimate anything the department has not confirmed.
        </p>
        <Link
          href="/timetable"
          className="pressable inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-hover"
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
      {dot && <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dot)} />}
      {label}
      <span className="tnum text-[11px] text-muted">{count}</span>
    </button>
  );
}
