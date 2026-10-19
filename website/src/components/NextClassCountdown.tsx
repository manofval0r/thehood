"use client";

import * as React from "react";
import Link from "next/link";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

/**
 * Countdown to the next class, sized for the homepage.
 *
 * The navbar carries the same information compactly; this is the bold reading
 * of it, centred, because on the landing page it is the one thing a student
 * opening the site on a morning actually wants.
 *
 * The digits are tabular so the layout never shifts as the numbers change.
 * Without that, a countdown reflows the whole row every second, which reads
 * as jitter even when nothing is actually animating.
 */
export default function NextClassCountdown({ className }: { className?: string }) {
  const { text, next, ready } = useCountdown();

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

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
        {next.inProgress ? "In progress now" : "Next class"}
      </p>

      {/* The clock itself. The only large type on the page. */}
      <p
        className="tnum mt-3 font-mono text-[clamp(2.75rem,9vw,5rem)] font-bold leading-none tracking-[-0.03em] text-foreground"
        aria-live="off"
      >
        {ready ? text : "--:--:--"}
      </p>

      <p className="mt-3 text-[13px] text-muted-foreground">
        {ready ? (
          <>
            until {next.inProgress ? "this class ends" : "it starts"}
          </>
        ) : (
          "reading the clock"
        )}
      </p>

      <Link
        href="/timetable"
        className="pressable mt-6 inline-flex max-w-lg flex-col items-center gap-1 rounded-full border border-border px-5 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        <span className="text-[15px] font-semibold text-foreground">{course.title}</span>
        <span className="text-[12.5px] text-muted-foreground">
          <span className="font-mono font-bold text-accent">{course.code}</span>
          <span className="mx-1.5 text-muted">/</span>
          {course.dayName}, {course.venue}
        </span>
      </Link>
    </div>
  );
}
