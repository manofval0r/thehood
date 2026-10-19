"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Apple-style card: 3D tilt + cursor-tracking spotlight.
 *
 * Two structural rules this component exists to enforce:
 *
 * 1. `perspective` only affects DIRECT children. The tilt element must be the
 *    immediate child of the perspective wrapper, so this renders exactly one
 *    div. An extra wrapper silently flattens the whole effect.
 *
 * 2. `transform-style: preserve-3d` is computed to `flat` on any element with
 *    `overflow` other than `visible`. The tilt element therefore never sets
 *    overflow; clipped overlays carry `border-radius: inherit` instead.
 *
 * Pointer position is written straight to CSS custom properties, so sweeping
 * the mouse across a grid of these never triggers a React render.
 * Tilt is capped at 6 degrees: dimensional, never disorienting.
 */

interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tilt strength in degrees. Keep between 5 and 8. */
  maxTilt?: number;
}

export function AppleCard({
  maxTilt = 6,
  className,
  children,
  ...rest
}: AppleCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<number | null>(null);
  const pending = React.useRef<{ x: number; y: number; nx: number; ny: number } | null>(
    null
  );

  const flush = React.useCallback(() => {
    const el = ref.current;
    const p = pending.current;
    frame.current = null;
    if (!el || !p) return;
    el.style.setProperty("--mx", `${p.x}%`);
    el.style.setProperty("--my", `${p.y}%`);
    el.style.setProperty("--rx", `${(p.ny * -maxTilt).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(p.nx * maxTilt).toFixed(2)}deg`);
  }, [maxTilt]);

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Touch would fight the page scroll, and hover does not exist there.
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      pending.current = {
        x: (x / r.width) * 100,
        y: (y / r.height) * 100,
        nx: x / r.width - 0.5,
        ny: y / r.height - 0.5,
      };
      // Attribute write, not state: this flips the CSS transition to the
      // fast tracking curve. A React setState here would re-render the
      // whole grid on every mousemove.
      el.dataset.moving = "true";
      // Coalesce to one style write per frame.
      if (frame.current === null) frame.current = requestAnimationFrame(flush);
    },
    [flush]
  );

  const onPointerEnter = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Seed the light where the cursor actually is, so the very first frame
      // the user sees is lit rather than dark.
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--mx", `${(x / r.width) * 100}%`);
      el.style.setProperty("--my", `${(y / r.height) * 100}%`);
    },
    []
  );

  const onPointerLeave = React.useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pending.current = null;
    const el = ref.current;
    if (!el) return;
    el.dataset.moving = "false";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter(e);
    onPointerMove(e);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      data-moving="false"
      className={cn("card-3d", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export default AppleCard;
