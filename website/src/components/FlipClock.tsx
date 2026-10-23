"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Split-flap countdown.
 *
 * ONE FLAP PER DIGIT, which is the only way this reads correctly.
 *
 * A single card showing "03" cannot work: the digit is wider than it is tall
 * (measured on the loaded font at 0.663em advance by 0.73em cap height, an
 * aspect of 0.91), so two digits side by side are about 1.83 times the height
 * of one. Any card wide enough for both is far wider than it is tall, and the
 * digits end up small in the middle of it with the fold line crossing empty
 * space. That is what the first version did, and it read as two numbers
 * flipping up and down rather than one number split by a fold.
 *
 * Giving each digit its own flap makes the flap nearly square, which lets the
 * digit fill it. The fold then genuinely bisects the glyph, and that is the
 * whole effect.
 *
 * The glyph is sized so its cap height is 86% of the flap, and the line box
 * is set to the full flap height so the fold lands exactly at the digit's
 * midpoint. The bottom half is the same glyph shifted up by half its height,
 * which is what shows the lower half of the character.
 */

const DURATION = 300; // ms per half

interface FlipProps {
  /** One digit, "0" to "9". */
  digit: string;
}

function Flip({ digit }: FlipProps) {
  const [shown, setShown] = React.useState(digit);
  const [flipping, setFlipping] = React.useState(false);

  React.useEffect(() => {
    if (digit === shown) return;
    setFlipping(true);
    const done = setTimeout(() => {
      setShown(digit);
      setFlipping(false);
    }, DURATION * 2);
    return () => clearTimeout(done);
  }, [digit, shown]);

  return (
    <span className="flip" aria-hidden="true">
      {/* The resting card: the incoming digit, split at the fold. */}
      <span className="flip-half flip-top">
        <span className="flip-glyph">{digit}</span>
      </span>
      <span className="flip-half flip-bottom">
        <span className="flip-glyph flip-glyph-low">{digit}</span>
      </span>

      {flipping && (
        <>
          {/* Outgoing top half, folding down and away from the light. */}
          <span className="flip-leaf">
            <span className="leaf-top">
              <span className="flip-glyph">{shown}</span>
            </span>
          </span>
          {/* Incoming bottom half, folded up, turning down into place.
              Delayed by half a duration so the two move in sequence. */}
          <span className="flip-leaf">
            <span className="leaf-bottom">
              <span className="flip-glyph flip-glyph-low">{digit}</span>
            </span>
          </span>
        </>
      )}
    </span>
  );
}

interface FlipClockProps {
  /** Milliseconds remaining. */
  ms: number;
  className?: string;
  /**
   * "hero" is the landing page, "nav" is the compact navbar variant, and
   * "dock" is the floating next-class strip on a phone. They share every
   * rule; only the flap size differs.
   */
  size?: "hero" | "nav" | "mobile" | "dock";
}

/**
 * HH:MM:SS, or H:MM:SS under a day, with a days group only when there are
 * days to count.
 *
 * A leading "00" reads as a real quantity and makes a short countdown look
 * like a long one, so the days group is omitted entirely below 24 hours.
 */
export function FlipClock({ ms, className, size = "hero" }: FlipClockProps) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const groups: Array<{ label: string; digits: string[] }> = [
    ...(days > 0
      ? [{ label: "days", digits: String(days).padStart(2, "0").split("") }]
      : []),
    { label: "hrs", digits: pad(days > 0 ? hours % 24 : hours).split("") },
    { label: "min", digits: pad(minutes).split("") },
    { label: "sec", digits: pad(seconds).split("") },
  ];

  const spoken = [
    ...(days > 0 ? [`${days} ${days === 1 ? "day" : "days"}`] : []),
    `${days > 0 ? hours % 24 : hours} hours`,
    `${minutes} minutes`,
    `${seconds} seconds`,
  ].join(", ");

  return (
    <div
      className={cn(
        "flip-clock",
        size === "nav"
          ? "flip-clock-nav"
          : size === "mobile"
            ? "flip-clock-mobile"
            : size === "dock"
              ? "flip-clock-dock"
              : "flip-clock-hero",
        className
      )}
      role="timer"
      aria-label={spoken}
    >
      {groups.map((group, i) => (
        <React.Fragment key={group.label}>
          {i > 0 && (
            <span className="flip-colon" aria-hidden="true">
              :
            </span>
          )}
          <span className="flip-group">
            <span className="flip-group-flap">
              {group.digits.map((d, j) => (
                <Flip key={j} digit={d} />
              ))}
            </span>
            <span className="flip-group-label">{group.label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default FlipClock;