"use client";

import * as React from "react";
import ThemeSlider from "@/components/ThemeSlider";
import { cn } from "@/lib/utils";

/**
 * Light and dark switch, floating under the header.
 *
 * It floats under the bar rather than sitting in it, because the bar was
 * already carrying the links, the bell, the clock and the wordmark, and
 * because a switch that is in the same place on every page is a switch
 * people can find.
 *
 * A floating control is on top of something. The pages put links in their
 * top right corners, and a reader reaching for one of them was reaching
 * for the switch. So the switch only takes the click when the reader's
 * pointer is on it or near it, which is exactly when they are reaching for
 * the switch and not for what is under it.
 *
 * It stays visible either way. A control that appears and disappears is a
 * control people have to learn, and the reader who cannot see it cannot
 * find it.
 *
 * Every property that changes here is compositor-only, so a scroll storm
 * moves it without touching layout.
 */

/** How close the pointer has to be for the switch to take the click. */
const REACH = 56;

/**
 * Whether the device has no real pointer.
 *
 * A finger has no hover position and a tap does not move one, so the rule
 * that only lets the switch take the click when the pointer is near it would
 * leave the switch unreachable on a touch screen. A coarse pointer means
 * there is no aiming and no hovering, so the switch is simply always live
 * there, and the thing under it is never swallowed.
 */
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

export default function ThemePill({ className }: { className?: string }) {
  const [lifted, setLifted] = React.useState(false);
  const [near, setNear] = React.useState(false);
  const coarse = useCoarsePointer();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const pointer = React.useRef({ x: -9999, y: -9999 });

  React.useEffect(() => {
    // Passive: this reads scroll position and pointer position, and must
    // never be the reason the page waits on the main thread.
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

    // The check reads the layout, so it is done once per frame rather than
    // once per event. A frame is also the shortest delay a pointer can
    // feel, and the pointer being near is what decides whether the switch
    // takes the click.
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

  /**
   * Whether the switch takes the click.
   *
   * A coarse pointer means there is no reaching, so it is always live.
   */
  const live = near || coarse;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40",
        // Clear of the header, and inside the page gutter on wide screens.
        "top-[calc(var(--nav-h,4rem)+0.75rem)] right-3 sm:right-5 lg:right-7",
        className
      )}
    >
      <ThemeSlider
        size="md"
        className={cn(
          "pointer-events-auto",
          // At the top of the page the switch is over the page's own
          // background, and a control with a surface and a border on a
          // surface is a shape nobody looks at. It rests there.
          //
          // Past the top of the page it is over content, and a translucent
          // control floating over a section is invisible against a light
          // one and dominant over a dark one. It becomes a real control:
          // a solid surface, a border and a lift.
          lifted
            ? "border-border-strong bg-surface shadow-lift"
            : "border-transparent bg-transparent",
          // It only takes the click when the reader is reaching for it.
          // On a touch screen there is no reaching, so it is always live.
          !live && "pointer-events-none"
        )}
        ref={buttonRef}
      />
    </div>
  );
}
