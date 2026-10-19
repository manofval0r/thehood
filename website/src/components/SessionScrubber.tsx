"use client";

import * as React from "react";
import { Play, Pause, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrubPoint {
  id: string;
  label: string;
  /** 0..1 position along the rail. */
  at: number;
}

interface SessionScrubberProps {
  points: ScrubPoint[];
  /** Called with the active point id as the user scrubs. */
  onActiveChange: (id: string) => void;
  /** Index of the point that represents "today". */
  todayIndex: number;
}

const AUTOPLAY_MS = 2600;

/**
 * A draggable scrubber for the academic calendar.
 *
 * Drag the pill (or use arrow keys) to move through the session. The fill,
 * the tick markers and the active point all follow, and the parent scrolls
 * the corresponding date into view. On mount it plays through the session
 * once, ending on today, so the page demonstrates its own structure.
 *
 * Pointer capture means the drag survives the cursor leaving the element,
 * and every visual update is a direct style write, so scrubbing does not
 * re-render React on each frame.
 */
export default function SessionScrubber({
  points,
  onActiveChange,
  todayIndex,
}: SessionScrubberProps) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);
  const [activeIdx, setActiveIdx] = React.useState(0);

  /**
   * Handle for the intro timer. Kept outside `playing` state deliberately:
   * a drag has to cancel a run that is already in flight, and toggling a
   * boolean cannot reach the interval that is still firing.
   */
  const autoRef = React.useRef<number | null>(null);
  const stopAuto = React.useCallback(() => {
    if (autoRef.current !== null) {
      window.clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  const count = points.length;

  /** Nearest point to a 0..1 position. */
  const indexAt = React.useCallback(
    (pos: number) => {
      if (count === 0) return 0;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < count; i++) {
        const d = Math.abs(points[i].at - pos);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [points, count]
  );

  const posFromEvent = React.useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) return 0;
    const r = rail.getBoundingClientRect();
    if (r.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  }, []);

  /** Paint the rail without a React render. */
  const paint = React.useCallback(
    (idx: number) => {
      const pos = points[idx]?.at ?? 0;
      const fill = fillRef.current;
      const thumb = thumbRef.current;
      if (fill) fill.style.transform = `scaleX(${pos})`;
      if (thumb) thumb.style.left = `${pos * 100}%`;
    },
    [points]
  );

  const commit = React.useCallback(
    (idx: number) => {
      setActiveIdx(idx);
      paint(idx);
      const id = points[idx]?.id;
      if (id) onActiveChange(id);
    },
    [paint, points, onActiveChange]
  );

  /* ---------------- autoplay once on mount ---------------- */
  React.useEffect(() => {
    if (count === 0) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      commit(todayIndex);
      setPlaying(false);
      return;
    }

    let i = 0;
    paint(0);
    const step = () => {
      i += 1;
      if (i >= count) {
        stopAuto();
        commit(todayIndex);
        setPlaying(false);
        return;
      }
      paint(i);
      setActiveIdx(i);
      onActiveChange(points[i].id);
    };
    autoRef.current = window.setInterval(step, 220);
    const done = window.setTimeout(() => {
      stopAuto();
      commit(todayIndex);
      setPlaying(false);
    }, 220 * count + 400);

    return () => {
      stopAuto();
      window.clearTimeout(done);
    };
    // Runs once; todayIndex/points are stable per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- dragging ---------------- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (count === 0) return;
    // Any interaction cancels the intro immediately.
    stopAuto();
    setPlaying(false);
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    commit(indexAt(posFromEvent(e.clientX)));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    commit(indexAt(posFromEvent(e.clientX)));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    let next = activeIdx;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(count - 1, activeIdx + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0, activeIdx - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault();
    stopAuto();
    setPlaying(false);
    commit(next);
  };

  const togglePlay = () => {
    stopAuto();
    if (playing) {
      setPlaying(false);
      return;
    }
    // Replay from the start, then stop at today.
    setPlaying(true);
    let i = 0;
    paint(0);
    autoRef.current = window.setInterval(() => {
      i += 1;
      if (i >= count) {
        stopAuto();
        commit(todayIndex);
        setPlaying(false);
        return;
      }
      paint(i);
      setActiveIdx(i);
      onActiveChange(points[i].id);
    }, AUTOPLAY_MS);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={16} className="text-accent" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
            Session timeline
          </h2>
        </div>
        <button
          onClick={togglePlay}
          className="pressable inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label={playing ? "Pause timeline" : "Play timeline"}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      {/* Rail */}
      <div
        ref={railRef}
        className="relative px-2 pb-7 pt-4"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={activeIdx}
        aria-valuetext={points[activeIdx]?.label}
        aria-label="Scrub the academic session"
        onKeyDown={onKeyDown}
      >
        <div className="scrub-track">
          <div ref={fillRef} className="scrub-fill" style={{ transform: "scaleX(0)" }} />
          {points.map((p, i) => (
            <span
              key={p.id}
              className="scrub-tick"
              data-active={i <= activeIdx}
              style={{ left: `${p.at * 100}%` }}
            />
          ))}
          <button
            ref={thumbRef}
            type="button"
            data-dragging={dragging}
            className="scrub-thumb"
            style={{ left: 0, transform: "translate(-50%, -50%)" }}
            aria-label="Timeline handle"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* End labels */}
        <div className="mt-4 flex justify-between text-[11px] text-muted-foreground">
          <span>{points[0]?.label}</span>
          <span>{points[count - 1]?.label}</span>
        </div>
      </div>

      {/* Active point readout */}
      <div className="mt-1 flex items-center justify-between border-t border-border pt-4">
        <p className="text-[13px] text-muted-foreground">
          {points[activeIdx]?.label}
        </p>
        <p className="tnum text-[13px] font-medium text-accent">
          {activeIdx === todayIndex ? "Today" : `Point ${activeIdx + 1} of ${count}`}
        </p>
      </div>
    </div>
  );
}