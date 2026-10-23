"use client";

import * as React from "react";
import Link from "next/link";
import { useCountdown } from "@/hooks/useCountdown";
import { FlipClock } from "@/components/FlipClock";
import { cn } from "@/lib/utils";

/**
 * Countdown floating below the navbar, on mobile only.
 *
 * The bar is already carrying the wordmark, the links, the bell and the
 * wordmark, so on a phone there is no room for a countdown inside it.
 * Instead the clock floats below the bar, exactly like the light/dark
 * slider, and it is measured so it never covers a link a reader might be
 * reaching for.
 *
 * When there are days to count the session is more than a day away, so the
 * clock gets the small mobile size and shows the days flap. When the class
 * is today (Monday through Thursday, the whole working week), there are no
 * days and the clock shrinks to just hours:minutes:seconds.
 */

const REACH = 56;

function useCoarsePointer() {
  const [coarse, setCoarse] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    if (!mq) return;
    const onChange = () => setCoarse(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return coarse;
}

export default function CountdownPill() {
  const [lifted, setLifted] = React.useState(false);
  const [near, setNear] = React.useState(false);
  const coarse = useCoarsePointer();
  const buttonRef = React.useRef<HTMLAnchorElement>(null);
  const pointer = React.useRef({ x: -9999, y: -9999 });
  const { text, next, ready } = useCountdown();

  const [ms, setMs] = React.useState(0);
  React.useEffect(() => {
    if (!ready) return;
    const [h, m, s] = text.split(":").map(Number);
    setMs(((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000);
  }, [text, ready]);

  if (!next) return null;

  const days = Math.floor(
    (next.startsAt.getTime() - new Date().getTime()) / 86400000
  );
  const live = near || coarse;

  React.useEffect(() => {
    let frame = 0;

    const check = () => {
      frame = 0;
      const el = buttonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = pointer.current;
      setNear(
        p.x >= r.left - REACH &&
          p.x <= r.right + REACH &&
          p.y >= r.top - REACH &&
          p.y <= r.bottom + REACH
      );
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(check);
    };

    const onScroll = () => {
      setLifted(window.scrollY > 24);
      schedule();
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      schedule();
    };

    const onPointerLeave = () => {
      pointer.current = { x: -9999, y: -9999 };
      setNear(false);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40",
        // Below the bar, inside the page gutter. The same spot the switch
        // floats in, so the two share the one empty place on the page.
        "top-[calc(var(--nav-h,4rem)+0.75rem)] right-3 sm:right-5 lg:right-7",
        // Mobile only. On desktop the clock stays in the bar where there is
        // room for it.
        "sm:hidden"
      )}
    >
      <Link
        href="/timetable"
        ref={buttonRef}
        className={cn(
          "pressable relative inline-flex shrink-0 items-center rounded-full p-1",
          "border border-border bg-surface transition-colors",
          lifted ? "border-border-strong bg-surface shadow-lift" : "border-transparent bg-transparent",
          // It only takes the click when the reader is reaching for it.
          // On a touch screen there is no reaching, so it is always live.
          !live && "pointer-events-none"
        )}
        aria-label={`Next class: ${next.course.title}, ${next.course.code}, in ${text}`}
      >
        <FlipClock ms={ms} size={days > 0 ? "mobile" : "nav"} />
      </Link>
    </div>
  );
}
