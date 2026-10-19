"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SessionRailProps {
  count: number;
  activeIndex: number;
  todayIndex: number;
  /** Called while dragging, with the index under the handle. */
  onScrub: (index: number, dragging: boolean) => void;
  /** Called when a drag starts, so the page can stop any active scroll animation. */
  onDragStart: () => void;
  className?: string;
}

/**
 * Where on screen a row is "the one being looked at", as a viewport fraction.
 *
 * Kept high, at 28%. The focus row should land where the eye already is
 * rather than below it: sitting it at the middle of the viewport made the
 * reader look down to check it, and the session heading sat far enough above
 * that the row read as the third thing on screen instead of the first.
 */
const FOCAL = 0.28;

/**
 * The vertical session rail.
 *
 * Two properties matter more than the look.
 *
 * It is sticky, so it never scrolls away and the control is always reachable.
 *
 * Dragging tracks 1:1. The rail computes which row sits under the handle and
 * sets scrollTop to put that row at the focal line, in the same frame. It does
 * NOT call scrollIntoView with smooth behaviour, because that animates over a
 * fixed duration: dragging would lag the pointer, and lifting would throw a
 * snap on top of the user's aim. Directness beats smoothness here, and the
 * rail's own transitions absorb the rest.
 *
 * The handle is the only thing that moves geometry. Its position is written as
 * a transform so it stays on the compositor, never re-laid-out.
 */
export default function SessionRail({
  count,
  activeIndex,
  todayIndex,
  onScrub,
  onDragStart,
  className,
}: SessionRailProps) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLButtonElement>(null);
  const draggingRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);

  const frac = count > 1 ? activeIndex / (count - 1) : 0;

  // Paint from React state: cheap, and this only changes when the active row
  // changes rather than on every scroll frame.
  React.useEffect(() => {
    if (fillRef.current) fillRef.current.style.transform = `scaleY(${frac})`;
    if (handleRef.current)
      handleRef.current.style.transform = `translate(-50%, -50%) translateY(${
        frac * 100
      }%)`;
  }, [frac]);

  const indexFromClientY = React.useCallback(
    (clientY: number) => {
      const rail = railRef.current;
      if (!rail || count === 0) return 0;
      const r = rail.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
      return Math.round(p * Math.max(0, count - 1));
    },
    [count]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (count === 0) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    setDragging(true);
    onDragStart();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    onScrub(indexFromClientY(e.clientY), true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    onScrub(indexFromClientY(e.clientY), true);
  };

  const release = React.useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    onScrub(activeIndex, false);
  }, [activeIndex, onScrub]);

  // Safety net: any path that ends the gesture clears the flag.
  React.useEffect(() => {
    const up = () => release();
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [release]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    let next: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = Math.min(count - 1, activeIndex + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = Math.max(0, activeIndex - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else if (e.key === "PageDown") next = Math.min(count - 1, activeIndex + 5);
    else if (e.key === "PageUp") next = Math.max(0, activeIndex - 5);
    else return;
    e.preventDefault();
    onDragStart();
    onScrub(next, false);
  };

  if (count === 0) return null;

  return (
    <div className={cn("flex h-full flex-col items-center", className)}>
      <span className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {activeIndex + 1}/{count}
      </span>

      <div
        ref={railRef}
        className="relative w-8 flex-1 cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ maxHeight: "62vh" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={activeIndex}
        aria-label="Scrub the session"
        onKeyDown={onKeyDown}
      >
        {/* Track */}
        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-surface-raised" />

        {/* Progress */}
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-accent-dim to-accent"
          style={{ transform: "scaleY(0)" }}
        />

        {/* Ticks */}
        {Array.from({ length: count }).map((_, i) => {
          const p = i / Math.max(1, count - 1);
          const passed = i <= activeIndex;
          const today = i === todayIndex;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-1/2 block -translate-x-1/2 rounded-full",
                today
                  ? "h-2 w-2 bg-foreground"
                  : passed
                    ? "h-1.5 w-1.5 bg-accent"
                    : "h-1 w-1 bg-border-strong"
              )}
              style={{ top: `${p * 100}%` }}
            />
          );
        })}

        {/* Handle. Transform only: no layout on the drag path. */}
        <button
          ref={handleRef}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          data-dragging={dragging}
          className="rail-handle absolute left-1/2 top-0 block"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <span className="rail-handle-grip" />
        </button>
      </div>

      <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        Session
      </span>
    </div>
  );
}

export { FOCAL };
