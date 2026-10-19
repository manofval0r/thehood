"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { FlipClock } from "@/components/FlipClock";
import { cn } from "@/lib/utils";

/**
 * Countdown to the next class, sized for the homepage.
 *
 * The digits are a split-flap clock. That is a deliberate choice for a page a
 * student opens at 7am: a ticking clock reads as "something is live", which a
 * plain number counter does not.
 *
 * The days unit is rendered only when there are days to count. A leading "00"
 * reads as a real quantity and makes an afternoon feel like a deadline.
 */
export default function NextClassCountdown({ className }: { className?: string }) {
  const { text, next, ready } = useCountdown();
  const [ms, setMs] = React.useState(0);

  // Track the remaining milliseconds from the same source the text comes
  // from, so the clock and the label can never disagree.
  React.useEffect(() => {
    if (!ready) return;
    const parts = text.split(":").map(Number);
    setMs(
      ((parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)) * 1000
    );
  }, [text, ready]);

  if (!next) {
    return (
      <div className={cn("text-center", className)}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          No further lectures scheduled
        </p>
      </div>
    );
  }

  const { course } = next;
  const running = next.inProgress;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            running ? "bg-accent" : "bg-muted"
          )}
          aria-hidden="true"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {running ? "In progress now" : "Next class"}
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        {ready ? (
          <FlipClock ms={ms} />
        ) : (
          <div className="h-[clamp(4rem,11vw,6.5rem)] w-[13.5rem]" aria-hidden="true" />
        )}
      </div>

      <p className="mt-5 text-[13px] text-muted-foreground">
        {running ? "until this class ends" : "until it starts"}
      </p>

      {/* The course. Accent lives on the code chip only; a green border, green
          text and a green mark at once made the whole block read as an alarm
          rather than as information. */}
      <Link
        href="/timetable"
        className="pressable group relative mt-8 flex w-full max-w-xl items-center gap-4 overflow-hidden rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-accent"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold text-foreground">
            {course.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
            <span className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[11px] font-bold text-accent">
              {course.code}
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock size={12} className="opacity-60" />
              {course.dayName}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} className="opacity-60" />
              {course.venue}
            </span>
          </span>
        </span>
        <ArrowRight
          size={16}
          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        />
      </Link>

      <p className="mt-3 text-[12px] text-muted">
        {running ? "Ends" : "Starts"} {ready ? text : "--:--:--"} ·{" "}
        <Link
          href="/timetable"
          className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          full timetable
        </Link>
      </p>
    </div>
  );
}
