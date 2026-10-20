"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FlipClock from "@/components/FlipClock";
import { Wordmark } from "@/components/Wordmark";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

/**
 * GitHub-style repository navigation, as a set of pills that contract into a
 * floating bar once the page scrolls.
 *
 * On the jitter: the scrolled state deliberately changes NO geometry. The
 * header is a fixed height and the inner bar is a fixed height, so the only
 * things that animate are background, border, shadow and the sliding pill
 * indicator, all on one shared curve. An earlier version shrank the bar and
 * added inset padding while scrolling; because those are layout properties,
 * every scroll frame fought the transition and the bar visibly juddered. A
 * float reads as floating because of its material, not because it resizes.
 */

const TABS = [
  { href: "/", label: "Courses" },
  { href: "/timetable", label: "Timetable" },
  { href: "/timeline", label: "Calendar" },
  { href: "/registration", label: "Registration" },
  { href: "/resources", label: "Resources" },
  { href: "/news", label: "News" },
  { href: "/careers", label: "Careers" },
  { href: "/events", label: "Events" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });
  const tabListRef = useRef<HTMLDivElement>(null);

  const countdown = useCountdown();

  // Milliseconds for the flip clock. Derived from the same formatted string
  // the label uses, so the two can never disagree about what time it is.
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!countdown.ready) return;
    const [h, m, s] = countdown.text.split(":").map(Number);
    setMs(((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000);
  }, [countdown.text, countdown.ready]);

  const activeHref = TABS.find((t) =>
    t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)
  )?.href;

  /**
   * Measure the active link's real box rather than assuming it is centred.
   * Positioning the pill from the viewport centre was why it sat a few pixels
   * off the word it was meant to mark, and why it drifted when the row height
   * changed.
   */
  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-href="${activeHref}"]`);
    if (!el) return;
    setPill({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      ready: true,
    });
  }, [activeHref]);

  // One boolean across a threshold. React bails out when the value is
  // unchanged, so this stays cheap on every scroll event.
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 16;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const next = countdown.next;

  return (
    <>
      <header className="sticky top-0 z-40 h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative flex h-12 w-full items-center justify-between rounded-full pl-4 pr-2",
              "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              scrolled
                ? "border border-border-strong bg-surface/80 shadow-lift backdrop-blur-xl"
                : "border border-transparent"
            )}
          >
            <Link
              href="/"
              className={cn(
                // Mobile only. Once the page has scrolled, the wordmark gives
                // its width back to the link rail, which is the one thing on a
                // phone that was genuinely short of room. On a desktop there is
                // room for both, and the identity is doing work there.
                "shrink-0 overflow-hidden whitespace-nowrap rounded-full",
                "transition-[max-width,opacity] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
                // Desktop keeps the full lockup. There is room for it there and
                // the identity is doing work.
                "lg:max-w-none lg:opacity-100",
                // Below xl the words go and only the mark stays. The wordmark
                // is 170px and the countdown 128px; on a 375px phone that is
                // 298 of 307 usable pixels, so keeping both leaves a one-pixel
                // gap for five links. The mark alone is 30px, which buys back
                // two visible links. This is the same text that collapses on
                // scroll, just starting earlier, because a phone has no room
                // for it at any point.
                //
                // The cut-off moved up to xl because the bar grew: with eight
                // links the words and the links together no longer fit
                // between 1024 and 1280, and at those widths the links are
                // navigation while the words are identity. The mark carries
                // the identity on its own.
                "max-xl:[&_[data-wordmark-text]]:hidden",
                scrolled ? "max-w-0 opacity-0 lg:max-w-none lg:opacity-100" : "max-w-[10rem] opacity-100"
              )}
              aria-label="Cybersecurity 300L home"
              // Out of the tab order once collapsed, or a keyboard user who has
              // scrolled keeps a tab stop that shows nothing.
              tabIndex={scrolled ? -1 : 0}
            >
              <Wordmark size="md" />
            </Link>

            {/* ---------- Tabs ----------
                Visible at every width, scrolling horizontally when they run
                out of room. There is no hamburger: a phone that hides five
                links and a live countdown behind a tap is a phone you have to
                operate before you can navigate, and the links are the most
                used thing in the bar.

                The countdown is pinned outside this scroller, so it can never
                be scrolled off. It is the reason a student checks the bar, and
                "scroll to find out when your class is" is not a good trade
                for "it is always there". */}
            <div
              className={cn(
                // Phone: a rail that takes the leftover width and scrolls.
                "min-w-[4.5rem] flex-1 overflow-x-auto overscroll-x-contain",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                // The links sit in the space between the wordmark and the
                // countdown and are centred in whatever is left. An earlier
                // version took them out of the flow and centred them on the
                // whole bar instead, which looked right until there were
                // enough of them: the group grew until it ran into the
                // countdown, and a bar whose links overlap the clock is
                // worse than one whose links are not quite on the centre
                // line. Centred in the gap, they cannot reach the clock at
                // any width, and they scroll when the gap is too small.
                "flex",
              )}
            >
              <div
                ref={tabListRef}
                // Auto margins rather than justify-content: when the links
                // are wider than the rail, auto margins resolve to zero and
                // the rail scrolls from the first link, whereas a centred
                // flex row clips the first link with no way to scroll to it.
                className="relative mx-auto flex h-full w-max items-center"
              >
                {/* Sits exactly on the active link's measured box. rounded-lg,
                    not rounded-full: a full pill on a 32px row reads as a
                    lozenge and swallows the word it is meant to mark. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    // top-0/left-0 pin the origin to the container's padding box.
                    // Without it the absolutely positioned box takes its static
                    // position from `align-items: center`, which already sits it
                    // 7px down, and the measured translate is applied on top of
                    // that, doubling the offset.
                    "pointer-events-none absolute left-0 top-0 rounded-lg bg-accent/14 ring-1 ring-inset ring-accent/30",
                    "transition-[transform,opacity] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                    pill.ready ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
                    width: pill.width,
                    height: pill.height,
                  }}
                />

                {TABS.map((t) => {
                  const active = t.href === activeHref;
                  return (
                    <Link
                      key={t.href}
                      data-href={t.href}
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        // px-3 rather than px-3.5: with eight links the
                        // half-pixel of extra padding on each side was
                        // thirty-two pixels across the row, which is the
                        // difference between the last link fitting beside the
                        // countdown and being clipped by it.
                        "pressable relative z-10 flex h-8 shrink-0 items-center rounded-full px-3 text-[13.5px] font-medium transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ---------- Countdown ----------
                Pinned to the end of the bar, outside the link scroller. */}
            {next && (
              <Link
                href="/timetable"
                className="pressable group/cd ml-1.5 flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-2 pr-2.5 transition-colors hover:border-border-strong hover:bg-surface-hover sm:ml-2 sm:gap-2 sm:pl-2.5 sm:pr-3"
                aria-label={`${next.inProgress ? "In progress" : "Next class"}: ${next.course.title}, ${next.course.code}, in ${countdown.text}`}
              >
                {/* The live-dot only earns its width once there is room for
                    it. On a phone the flaps themselves are the signal, and
                    14px is 4% of the bar. */}
                <span
                  className={cn(
                    "hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block",
                    next.inProgress ? "bg-accent" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
                <FlipClock ms={ms} size="nav" className="shrink-0" />
                {/* The course name needs about 150px the tab row may not have.
                    Below that width the flaps alone still say what time it is,
                    and the label carries the rest, so the control is never
                    dropped entirely to save space. */}
                <span className="hidden min-w-0 xl:block">
                  <span className="block truncate text-[11.5px] font-medium leading-tight text-foreground">
                    {next.course.title}
                  </span>
                  <span className="block font-mono text-[10px] leading-tight text-muted">
                    {next.course.code}
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
