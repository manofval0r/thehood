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
  const [dragging, setDragging] = React.useState(false);

  /**
   * Writes are synchronous.
   *
   * An earlier version coalesced them into requestAnimationFrame, which is
   * wrong here on two counts. Only the single card under the cursor receives
   * pointermove events, so the frame budget being saved is about sixty custom
   * property writes a second, not six hundred. And rAF is throttled to zero in
   * a background tab, in low power mode and in some headless environments, so
   * the tilt silently stopped applying whenever the frame loop was not
   * running. Direct manipulation that depends on a frame is not direct.
   */
  const apply = React.useCallback(
    (clientX: number, clientY: number, moving: boolean) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;

      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      // The Y axis is inverted: moving the pointer up pitches the top of the
      // card away, which is what makes the card appear to lean toward you.
      el.style.setProperty("--rx", `${((y - 0.5) * -maxTilt).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * maxTilt).toFixed(2)}deg`);
      el.dataset.moving = moving ? "true" : "false";
    },
    [maxTilt]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Touch would fight the page scroll, and hover does not exist there.
      if (e.pointerType === "touch") return;
      apply(e.clientX, e.clientY, true);
    },
    [apply]
  );

  const onPointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setDragging(false);
      // Ease back to rest from the light's resting place rather than
      // mid-gesture, so the spotlight does not streak across the card.
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.dataset.moving = "false";
      void e;
    },
    []
  );

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
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
