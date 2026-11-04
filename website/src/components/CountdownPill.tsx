"use client";

import Link from "next/link";
import { useCountdown } from "@/hooks/useCountdown";
import { FlipClock } from "@/components/FlipClock";

/**
 * The next class, floating below the navbar on a phone.
 *
 * The bar already carries the wordmark, the links and the bell, so there is no
 * room for a clock inside it on a narrow screen. This is the one thing a
 * student opens the site to check, so it gets its own strip in the page's top
 * padding rather than a tiny pill in the corner.
 *
 * The old version was only six tiny flaps with no course and no label, and it
 * sat directly on top of the light/dark switch. The switch now lives at the
 * bottom of a phone screen; this strip has the whole width, names the class,
 * and says what is being counted down to.
 */
export default function CountdownPill() {
  const { text, next, ready, phase, note } = useCountdown();

  // The first render has no clock, because the countdown is worked out in the
  // browser. Rendering nothing until it is ready keeps the server and client
  // markup identical and avoids a flash of a class that has already started.
  if (!ready || !next) return null;

  const [h, m, s] = text.split(":").map(Number);
  const ms = ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000;

  const label =
    phase === "in-break"
      ? "On a break"
      : next.inProgress
        ? "In progress"
        : "Next class";

  return (
    <>
      {/* The dock is fixed, so the page has to leave its height in the flow.
          Without this the first breadcrumb or download button starts behind
          it. The dock measures 46px including its border, plus the half-rem
          gap below the bar. No next class means no dock and no spacer. */}
      <div
        aria-hidden="true"
        className="h-[calc(0.5rem+2.875rem)] shrink-0 sm:hidden"
      />
      <div className="fixed inset-x-3 top-[calc(var(--nav-h,4rem)+0.5rem)] z-30 sm:hidden">
        <Link
          href="/timetable"
          aria-label={`${label}: ${next.course.title}, ${next.course.code}, ${note} ${text}`}
          className="pressable flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border-strong bg-surface/95 px-3 py-1.5 shadow-lift backdrop-blur-xl"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-accent">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              {label}
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] font-medium leading-snug text-foreground">
              {next.course.code} · {next.course.title}
            </span>
          </span>

          <span className="shrink-0">
            <FlipClock ms={ms} size="dock" />
          </span>
        </Link>
      </div>
    </>
  );
}
