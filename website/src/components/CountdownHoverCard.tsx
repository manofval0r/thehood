"use client";

import * as React from "react";
import { ChevronDown, Clock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useBreaks } from "@/components/ScheduleProvider";
import { breakFor, breaksIn, segmentsFor } from "@/lib/breaks";
import { cn } from "@/lib/utils";

/**
 * A hover card that hangs off the countdown clock.
 *
 * Fully self-contained: it manages its own hover state, so it can be placed
 * anywhere next to the clock and just works. Shows what period comes next,
 * whether it is the same class that is already running, and how many breaks
 * fall inside it.
 */
export default function CountdownHoverCard() {
  const { text, next, ready, phase } = useCountdown();
  const breaks = useBreaks();
  const [open, setOpen] = React.useState(false);

  if (!ready || !next) return null;

  const breakMin = breakFor(
    breaks,
    next.course.code,
    next.course.dayIndex,
    next.course.startMin
  );
  const sessionBreaks = breaksIn(
    next.course.startMin,
    next.course.endMin,
    breakMin
  );
  const periods = segmentsFor(
    next.course.startMin,
    next.course.endMin,
    breakMin
  ).filter((s) => s.kind === "teach");

  const label =
    phase === "in-break"
      ? "On a break"
      : next.inProgress
        ? "In progress"
        : "Next class";

  const isSameClass = next.inProgress;
  const periodCount = periods.length;
  const breakCount = sessionBreaks.length;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="pressable flex min-h-11 items-center justify-between gap-3 rounded-full border border-border-strong bg-surface px-3 py-1.5 shadow-lift backdrop-blur-xl transition-colors hover:border-accent hover:text-accent"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-accent">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] font-medium leading-snug text-foreground">
            {next.course.code} · {next.course.title}
          </span>
        </span>

        <span className="shrink-0 flex items-center gap-1 text-muted transition-colors hover:text-accent">
          <Clock size={13} />
          <span className="font-mono text-[11px]">{text}</span>
          <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Next class details"
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 w-[240px] rounded-xl border border-border-strong bg-surface shadow-lift animate-[fadeIn_220ms_ease-out]"
        >
          {/* Arrow pointing up to the trigger */}
          <svg
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 text-border-strong rotate-45"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 15l3-3m0 0l3 3m-3-3l-3 3"
            />
          </svg>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                Next class
              </span>
            </div>
            <p className="text-[12px] font-semibold text-foreground mb-1 truncate">
              {next.course.title}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono mb-3">
              {next.course.code}
            </p>

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Periods</span>
                <span className="text-foreground font-medium">
                  {periodCount} teaching{" "}{periodCount === 1 ? "block" : "blocks"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Breaks</span>
                <span className="text-foreground font-medium">
                  {breakCount} break{breakCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Status</span>
                <span className={`text-foreground font-medium ${isSameClass ? "text-accent" : "text-muted-foreground"}`}>
                  {isSameClass ? "In progress now" : "Starting later"}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-surface/50 p-3 text-center">
            <a
              href="/timetable"
              className="text-[10px] text-muted transition-colors hover:text-accent"
            >
              Opens the timetable
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
