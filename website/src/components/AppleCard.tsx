"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Apple-style card: 3D tilt + cursor-tracking spotlight.
 *
 * Pointer position is written directly to CSS custom properties on the
 * node, so moving the mouse across a grid of these never triggers a React
 * render. The visual work is done by `.card-tilt` / `.card-spotlight` /
 * `.card-accent-glow` in globals.css.
 *
 * Tilt is capped at 7 degrees: enough to feel dimensional, not enough to
 * disorient. Everything collapses under prefers-reduced-motion.
 */

interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tilt strength in degrees. 0 disables rotation but keeps the spotlight. */
  maxTilt?: number;
  /** Which layers get a little forward float on hover. */
  children: React.ReactNode;
}

export function AppleCard({
  maxTilt = 7,
  className,
  children,
  ...rest
}: AppleCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<number | null>(null);
  const pending = React.useRef<{ x: number; y: number } | null>(null);

  const flush = React.useCallback(() => {
    const el = ref.current;
    const p = pending.current;
    frame.current = null;
    if (!el || !p) return;
    el.style.setProperty("--mx", `${p.x}%`);
    el.style.setProperty("--my", `${p.y}%`);
  }, []);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore touch: on a touch screen this would fight the scroll.
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      pending.current = { x, y };
      // Coalesce to one write per frame.
      if (frame.current === null) {
        frame.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  const onPointerLeave = React.useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pending.current = null;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  const onPointerEnter = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Seed the light where the cursor actually is, so the first frame
      // the user sees is lit rather than dark.
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    },
    []
  );

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter(e);
    onPointerMove(e);
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(ny * -maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(nx * maxTilt).toFixed(2)}deg`);
  };

  return (
    <div className={cn("card-3d", className)}>
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

export default AppleCard;