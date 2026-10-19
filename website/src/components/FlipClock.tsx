"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Split-flap countdown.
 *
 * A real flip, not a fade: on a change the outgoing half rotates away around
 * the fold line, and the incoming half rotates down behind it. Both halves
 * are driven by one CSS animation each, with the second half delayed by half
 * the duration, so the two halves never overlap.
 *
 * The static layer underneath always shows the incoming value, which is what
 * the eye sees during the seam. That seam is the whole trick: without it there
 * is a visible gap between the two halves rotating.
 */

const DURATION = 320; // ms per half

interface FlipProps {
  /** Zero-padded value, e.g. "07". */
  value: string;
  className?: string;
}

export function Flip({ value, className }: FlipProps) {
  const [shown, setShown] = React.useState(value);
  const [flipping, setFlipping] = React.useState(false);

  React.useEffect(() => {
    if (value === shown) return;
    setFlipping(true);
    const done = setTimeout(() => {
      setShown(value);
      setFlipping(false);
    }, DURATION * 2);
    return () => clearTimeout(done);
  }, [value, shown]);

  return (
    <span
      className={cn("flip", className)}
      style={{ ["--flip-ms" as string]: `${DURATION}ms` }}
    >
      {/* Static layer: the incoming value, visible during the seam. */}
      <span className="flip-half flip-top" aria-hidden={flipping ? "true" : undefined}>
        {value}
      </span>
      <span className="flip-half flip-bottom" aria-hidden={flipping ? "true" : undefined}>
        {value}
      </span>

      {flipping && (
        <>
          {/* Outgoing top half, rotating down and away. */}
          <span className="flip-leaf" aria-hidden="true">
            <span className="leaf-top">{shown}</span>
          </span>
          {/* Incoming bottom half, rotating down into place. */}
          <span className="flip-leaf" aria-hidden="true">
            <span className="leaf-bottom">{value}</span>
          </span>
        </>
      )}

      {/* The one thing a screen reader hears. */}
      <span className="sr-only">{value}</span>
    </span>
  );
}

interface FlipClockProps {
  /** Seconds remaining. */
  ms: number;
  className?: string;
}

/**
 * HH:MM:SS, or H:MM:SS past a day.
 *
 * The days unit is only rendered when there are days to show. A leading "00"
 * reads as a real number and makes a short countdown look like a long one.
 */
export function FlipClock({ ms, className }: FlipClockProps) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const d = Math.floor(total / 86400);

  const p = (n: number) => String(n).padStart(2, "0");
  const hours = d > 0 ? String(h % 24).padStart(2, "0") : p(h);

  const units = [
    ...(d > 0 ? [{ label: "days", value: String(d).padStart(2, "0") }] : []),
    { label: "hrs", value: hours },
    { label: "min", value: p(m) },
    { label: "sec", value: p(s) },
  ];

  return (
    <div
      className={cn("flip-clock", className)}
      role="timer"
      aria-label={
        d > 0
          ? `${d} days, ${hours} hours, ${p(m)} minutes and ${p(s)} seconds`
          : `${hours} hours, ${p(m)} minutes and ${p(s)} seconds`
      }
    >
      {units.map((u, i) => (
        <div key={u.label} className="flip-unit">
          <Flip value={u.value} />
          <span className="flip-unit-label">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

export default FlipClock;
