"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Marks today, and which of today's classes is running or next.
 *
 * Renders nothing on the server and after-hydration decides what to show, so
 * the server HTML and the first client render agree. Reading the clock during
 * SSR would bake a date into the HTML that can be wrong by the time it lands.
 */

type Status = "day" | "now" | "next" | "none";

function useStatus(dayIndex: number, startMin?: number, endMin?: number): Status {
  const [status, setStatus] = React.useState<Status>("none");

  React.useEffect(() => {
    const compute = () => {
      const now = new Date();
      if (now.getDay() !== dayIndex) return setStatus("none");
      if (startMin === undefined || endMin === undefined) return setStatus("day");
      const min = now.getHours() * 60 + now.getMinutes();
      if (min >= startMin && min < endMin) return setStatus("now");
      if (min < startMin) return setStatus("next");
      return setStatus("none");
    };
    compute();
    // Re-evaluate each minute: a class rolls from "next" to "now" on its own.
    const id = window.setInterval(compute, 60_000);
    return () => window.clearInterval(id);
  }, [dayIndex, startMin, endMin]);

  return status;
}

/** Chip on the day heading. */
export function TodayHeading({ dayIndex }: { dayIndex: number }) {
  const status = useStatus(dayIndex);
  if (status === "none") return null;

  return (
    <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">
      Today
    </span>
  );
}

/** Marker on an individual class row. */
export function SlotStatus({
  dayIndex,
  startMin,
  endMin,
}: {
  dayIndex: number;
  startMin: number;
  endMin: number;
}) {
  const status = useStatus(dayIndex, startMin, endMin);
  if (status !== "now" && status !== "next") return null;

  const running = status === "now";

  return (
    <span
      className={cn(
        "ml-2.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.1em]",
        running
          ? "bg-accent text-accent-foreground"
          : "bg-accent/15 text-accent ring-1 ring-accent/40"
      )}
    >
      {running && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
      )}
      {running ? "Now" : "Next"}
    </span>
  );
}
