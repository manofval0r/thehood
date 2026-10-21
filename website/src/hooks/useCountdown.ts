"use client";

import * as React from "react";
import { formatCountdown, nextClass, type NextClass } from "@/lib/schedule";
import { breakFor, segmentsFor } from "@/lib/breaks";
import { useBreaks } from "@/components/ScheduleProvider";

export interface Countdown {
  /** HH:MM:SS remaining. */
  text: string;
  next: NextClass | null;
  /** False until the client clock is read, so server and client agree. */
  ready: boolean;
  /** What the clock is counting to. */
  phase: "to-start" | "to-break" | "in-break" | "to-end";
  /** The sentence under the clock. */
  note: string;
}

/**
 * Ticking countdown to the next class.
 *
 * `ready` is false on the server render. A clock read during SSR bakes a
 * timestamp into the HTML that is wrong by the time it reaches the browser,
 * and React reports the mismatch. Rendering a placeholder and filling it in
 * after mount keeps hydration honest.
 *
 * The clock knows about the breaks. A lecture is an hour of teaching, a
 * break, an hour of teaching, and the clock counts down to the break rather
 * than to the end of the lecture, because the break is the thing the
 * student is waiting for.
 */
export function useCountdown(): Countdown {
  const [now, setNow] = React.useState<Date | null>(null);
  const [ready, setReady] = React.useState(false);
  const breaks = useBreaks();

  React.useEffect(() => {
    setNow(new Date());
    setReady(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const next = React.useMemo(() => (now ? nextClass(now) : null), [now]);

  const plan = React.useMemo(() => {
    if (!now || !next) return null;

    const { course } = next;

    if (!next.inProgress) {
      return {
        target: next.startsAt,
        phase: "to-start" as const,
        note: "until it starts",
      };
    }

    const breakMin = breakFor(
      breaks,
      course.code,
      course.dayIndex,
      course.startMin
    );
    const segments = segmentsFor(course.startMin, course.endMin, breakMin);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const index = segments.findIndex(
      (s) => nowMin >= s.from && nowMin < s.to
    );
    const current = index >= 0 ? segments[index] : null;

    // Inside a break: counting down to the end of it.
    if (current?.kind === "break") {
      const at = new Date(
        next.endsAt.getTime() + (current.to - course.endMin) * 60000
      );
      return {
        target: at,
        phase: "in-break" as const,
        note: "until the class resumes",
      };
    }

    // Teaching, and a break is next.
    const upcoming = index >= 0 ? segments[index + 1] : null;
    if (upcoming?.kind === "break") {
      const at = new Date(
        next.endsAt.getTime() + (upcoming.from - course.endMin) * 60000
      );
      return {
        target: at,
        phase: "to-break" as const,
        note: "until the break",
      };
    }

    return {
      target: next.endsAt,
      phase: "to-end" as const,
      note: "until this class ends",
    };
  }, [now, next, breaks]);

  const text = React.useMemo(() => {
    if (!now || !plan) return "--:--:--";
    return formatCountdown(plan.target.getTime() - now.getTime());
  }, [now, plan]);

  return {
    text,
    next,
    ready,
    phase: plan?.phase ?? "to-start",
    note: plan?.note ?? "until it starts",
  };
}
