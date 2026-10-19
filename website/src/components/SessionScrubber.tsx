"use client";

import * as React from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScrubPoint {
  id: string;
  label: string;
  /** "October 2026" — used for the month ticks under the rail. */
  month: string;
  /** 0..1 position along the rail. */
  at: number;
}

interface SessionScrubberProps {
  points: ScrubPoint[];
  onActiveChange: (id: string) => void;
  todayIndex: number;
}

const AUTOPLAY_MS = 2600;
const TOUR_MS = 2600;

/**
 * Step interval for the opening sweep, scaled so the sweep always takes about
 * the same wall-clock time. A fixed 220ms step ran for eleven seconds on a
 * 51-event rail, which outlasts the patience of anyone landing on the page.
 */
function stepFor(count: number) {
  if (count <= 1) return TOUR_MS;
  return Math.max(22, Math.round(TOUR_MS / count));
}

/**
 * Draggable scrubber for the academic calendar.
 *
 * The position is owned by dragging only. Hovering does nothing, and that
 * guarantee needs one specific thing: drag state lives in a ref, not React
 * state. With `useState`, a press and release inside a single tick leaves the
 * release handler reading the pre-press `false`, so it bails out and never
 * clears the flag. The scrubber then stays "dragging" for the rest of the
 * session and chases the cursor anywhere on the page.
 *
 * `useState` is still used for the visual dragging flag, but it is never the
 * source of truth. A window-level pointerup/pointercancel listener clears the
 * ref unconditionally, so no release path can leave it stuck.
 */
export default function SessionScrubber({
  points,
  onActiveChange,
  todayIndex,
}: SessionScrubberProps) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLButtonElement>(null);

  /** Authoritative drag state. Read synchronously by every pointer handler. */
  const draggingRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const autoRef = React.useRef<number | null>(null);
  const stopAuto = React.useCallback(() => {
    if (autoRef.current !== null) {
      window.clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  const count = points.length;

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
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pos})`;
      if (thumbRef.current) thumbRef.current.style.left = `${pos * 100}%`;
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

  /* ---------------- release safety net ---------------- */
  React.useEffect(() => {
    const release = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);

  /* ---------------- intro ---------------- */
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
    autoRef.current = window.setInterval(step, stepFor(count));
    const done = window.setTimeout(() => {
      stopAuto();
      commit(todayIndex);
      setPlaying(false);
    }, stepFor(count) * count + 400);

    return () => {
      stopAuto();
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- dragging ---------------- */
  const beginDrag = (e: React.PointerEvent) => {
    if (count === 0) return;
    // Ignore secondary mouse buttons; a right-click should not scrub.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    draggingRef.current = true;
    setDragging(true);
    stopAuto();
    setPlaying(false);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    commit(indexAt(posFromEvent(e.clientX)));
  };

  const onMove = (e: React.PointerEvent) => {
    // The only gate. Ref, not state: no stale closure, no stuck flag.
    if (!draggingRef.current) return;
    commit(indexAt(posFromEvent(e.clientX)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count === 0) return;
    let next: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(count - 1, activeIdx + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(0, activeIdx - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else if (e.key === "PageUp" || e.key === "PageDown") {
      // Jump a whole month at a time.
      const dir = e.key === "PageDown" ? 1 : -1;
      const here = points[activeIdx]?.month;
      let i = activeIdx + dir;
      while (i >= 0 && i < count && points[i]?.month === here) i += dir;
      next = Math.min(count - 1, Math.max(0, i));
    } else return;

    e.preventDefault();
    stopAuto();
    setPlaying(false);
    commit(next);
  };

  const togglePlay = () => {
    stopAuto();
    draggingRef.current = false;
    setDragging(false);

    if (playing) {
      setPlaying(false);
      return;
    }

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

  // One label per month, positioned at the first event of that month.
  const monthMarks = React.useMemo(() => {
    const seen = new Set<string>();
    const out: { month: string; short: string; at: number }[] = [];
    for (const p of points) {
      if (seen.has(p.month)) continue;
      seen.add(p.month);
      out.push({
        month: p.month,
        short: p.month.split(" ")[0].slice(0, 3),
        at: p.at,
      });
    }
    return out;
  }, [points]);

  const active = points[activeIdx];
  const isToday = activeIdx === todayIndex;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">
            Drag through the session
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Grab the handle and pull. Arrow keys step, Page keys jump a month.
          </p>
        </div>
        <button
          onClick={togglePlay}
          className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label={playing ? "Pause the tour" : "Play the tour"}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? "Pause" : "Tour"}
        </button>
      </div>

      {/* Rail */}
      <div
        ref={railRef}
        className="relative cursor-grab px-1 pt-8 active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={beginDrag}
        onPointerMove={onMove}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={activeIdx}
        aria-valuetext={active ? `${active.label}. Point ${activeIdx + 1} of ${count}` : undefined}
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
              data-today={i === todayIndex}
              style={{ left: `${p.at * 100}%` }}
            />
          ))}

          <button
            ref={thumbRef}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-dragging={dragging}
            className="scrub-thumb"
            style={{ left: 0, transform: "translate(-50%, -50%)" }}
          >
            <span className="scrub-thumb-grip" />
          </button>
        </div>

        {/* Month ruler */}
        <div className="relative mt-3 h-4" aria-hidden="true">
          {monthMarks.map((m) => (
            <span
              key={m.month}
              className="absolute -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
              style={{ left: `${m.at * 100}%` }}
            >
              {m.short}
            </span>
          ))}
        </div>
      </div>

      {/* Readout. Announced politely so the position is not silent for AT. */}
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        aria-live="polite"
      >
        <div className="min-w-0">
          <p className="truncate text-[14px] text-foreground">{active?.label}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {active?.month}
            {active && (
              <>
                <span className="mx-1.5 text-muted">/</span>
                Point {activeIdx + 1} of {count}
              </>
            )}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-2 py-1 text-[11px] font-semibold",
            isToday ? "bg-accent text-accent-foreground" : "bg-surface-hover text-muted-foreground"
          )}
        >
          {isToday ? "Today" : `${Math.round(((activeIdx + 1) / count) * 100)}% through`}
        </span>
      </div>
    </div>
  );
}
