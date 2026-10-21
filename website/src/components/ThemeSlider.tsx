"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Light and dark switch, as a slider.
 *
 * A slider rather than a button, because a slider shows both states at once.
 * A one-way toggle has to be labelled with the thing it will switch to,
 * which is a label, and a label is what the reader was trying to avoid.
 *
 * The thumb sits under the icon of the mode that is on, so the control
 * answers "which mode am I in" without being read at all. The thumb slides
 * on transform only, so switching themes never triggers layout on the page.
 *
 * Two sizes, because the control lives in two places. The bar on a phone has
 * room for a button and not for a slider, and a switch that is a different
 * size in the bar and out of it is a switch that has to be learned twice.
 * The small size is the segmented form, which fits where a slider cannot.
 */

/**
 * The dimensions of each size, in one place so the two cannot drift.
 *
 * The travel is the distance from the first face to the second, so the
 * thumb lands exactly under the icon of the mode that is on. A thumb that
 * lands four pixels off looks like a mistake, and it is the kind of mistake
 * nobody reports but everybody sees.
 */
const SIZES = {
  /** In the bar. Two small faces side by side. */
  sm: {
    h: "h-7",
    thumb: "h-5 w-5",
    icon: 11,
    /** How far the thumb travels to the light end. */
    travel: "translate-x-5",
  },
  /** Floating under the bar. Two round faces on a round track. */
  md: {
    h: "h-9",
    thumb: "h-7 w-7",
    icon: 14,
    /** How far the thumb travels to the light end. */
    travel: "translate-x-7",
  },
} as const;

export type ThemeSliderSize = keyof typeof SIZES;

export default function ThemeSlider({
  size = "md",
  className,
  ref,
}: {
  size?: ThemeSliderSize;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const { theme, toggle, ready } = useTheme();
  const light = theme === "light";
  const s = SIZES[size];

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className={cn(
        "pressable relative inline-flex shrink-0 items-center rounded-full p-1",
        s.h,
        "border border-border bg-surface transition-colors",
        "hover:border-border-strong hover:bg-surface-hover",
        className
      )}
    >
      {/* The thumb. It sits under the icon of the mode that is on. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1 top-1 rounded-full",
          s.thumb,
          "bg-accent/14 ring-1 ring-inset ring-accent/30",
          "transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          light && s.travel
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full transition-colors duration-300",
          s.thumb,
          light ? "text-muted-foreground" : "text-accent"
        )}
      >
        <Moon size={s.icon} strokeWidth={2} />
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full transition-colors duration-300",
          s.thumb,
          light ? "text-accent" : "text-muted-foreground"
        )}
      >
        <Sun size={s.icon} strokeWidth={2} />
      </span>

      {/* Screen readers get a state, not just a button. */}
      <span className="sr-only" aria-live="polite">
        {ready ? `${light ? "Light" : "Dark"} mode` : ""}
      </span>
    </button>
  );
}
