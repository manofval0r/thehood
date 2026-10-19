"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { FlipClock } from "@/components/FlipClock";
import AppleCard from "@/components/AppleCard";
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

      {/* The class itself.

          This is the one thing on the page the student came for, so it is a
          real card rather than a line of text: it tilts and catches the
          pointer like every other card on the site, and it carries the code,
          the day and the room.

          Accent is rationed to the code chip and the leading rule. The earlier
          version put a green border, green label, green glyph and green glow
          on one block, which stopped being information and started being an
          alarm. */}
      <AppleCard maxTilt={5} className="mt-8 w-full max-w-xl">
        <Link
          href="/timetable"
          className="card-tilt settle group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
        >
          <span className="card-cast" aria-hidden="true" />
          <span className="card-accent-glow" aria-hidden="true" />
          <span className="card-bevel" aria-hidden="true" />

          <span
            aria-hidden="true"
            className="card-depth absolute inset-y-0 left-0 w-0.5 bg-accent"
          />

          <span className="card-depth min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[16px] font-semibold tracking-tight text-foreground">
                {course.title}
              </span>
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
              <span className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[11px] font-bold text-accent">
                {course.code}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} className="opacity-60" />
                {course.dayName}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="opacity-60" />
                {course.venue}
              </span>
            </span>
          </span>

          <ArrowRight
            size={17}
            aria-hidden="true"
            className="card-depth shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
            style={{ "--depth": "20px" } as React.CSSProperties}
          />
        </Link>
      </AppleCard>

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
