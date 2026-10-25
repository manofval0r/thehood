"use client";

import * as React from "react";

/**
 * A single shared tick loop for every assessment countdown on the page.
 *
 * One interval instead of one per timer: browsers throttle background tabs
 * to about once a minute, so every timer reads `dueAt - now()` on every tick
 * rather than accumulating delta and drifting. When the tab regains focus
 * the value snaps to the correct remaining time immediately.
 */
export function useSharedTick(intervalMs = 1000): Date {
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    const onFocus = () => setNow(new Date());
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);

  return now;
}

/** A stable student id kept in localStorage so assessments survive reloads. */
const STUDENT_ID_KEY = "cybersec-300l-student-id";

export function studentId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STUDENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    try {
      window.localStorage.setItem(STUDENT_ID_KEY, id);
    } catch {
      // Private mode or full storage: assessments still work for this session.
    }
  }
  return id;
}
