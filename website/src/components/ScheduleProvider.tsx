"use client";

import * as React from "react";
import {
  DEFAULT_BREAK_MIN,
  breakFor,
  type BreakSetting,
} from "@/lib/breaks";

/**
 * The breaks, for the parts of the site that run in the browser.
 *
 * The countdown and the timetable both need to know where the breaks fall,
 * and both are on the client. The settings are read once on the server and
 * handed down, so there is one answer about where a break falls rather than
 * two that can disagree.
 */

const ScheduleContext = React.createContext<BreakSetting[]>([]);

export function ScheduleProvider({
  breaks,
  children,
}: {
  breaks: BreakSetting[];
  children: React.ReactNode;
}) {
  return (
    <ScheduleContext.Provider value={breaks}>
      {children}
    </ScheduleContext.Provider>
  );
}

/** Every session's break, for every course. */
export function useBreaks(): BreakSetting[] {
  return React.useContext(ScheduleContext);
}

/** The break in one session, in minutes. */
export function useBreak(
  course: string,
  dayIndex: number,
  startMin: number
): number {
  const breaks = useBreaks();
  return breakFor(breaks, course, dayIndex, startMin);
}

export { DEFAULT_BREAK_MIN };
