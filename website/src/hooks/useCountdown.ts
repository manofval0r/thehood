"use client";

import * as React from "react";
import { formatCountdown, nextClass, type NextClass } from "@/lib/schedule";

export interface Countdown {
  /** HH:MM:SS remaining. */
  text: string;
  next: NextClass | null;
  /** False until the client clock is read, so server and client agree. */
  ready: boolean;
}

/**
 * Ticking countdown to the next class.
 *
 * `ready` is false on the server render. A clock read during SSR bakes a
 * timestamp into the HTML that is wrong by the time it reaches the browser,
 * and React reports the mismatch. Rendering a placeholder and filling it in
 * after mount keeps hydration honest.
 */
export function useCountdown(): Countdown {
  const [now, setNow] = React.useState<Date | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setNow(new Date());
    setReady(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const next = React.useMemo(() => (now ? nextClass(now) : null), [now]);

  const text = React.useMemo(() => {
    if (!now || !next) return "--:--:--";
    // A class in progress counts down to its end, not to a start in the past.
    const target = next.inProgress ? next.endsAt : next.startsAt;
    return formatCountdown(target.getTime() - now.getTime());
  }, [now, next]);

  return { text, next, ready };
}
