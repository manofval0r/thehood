"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FlipClock from "@/components/FlipClock";
import { Menu, X } from "lucide-react";
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
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const next = countdown.next;

  return (
    <>
      <header className="sticky top-0 z-40 h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "flex h-12 w-full items-center justify-between rounded-full pl-4 pr-2",
              "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              scrolled
                ? "border border-border-strong bg-surface/80 shadow-lift backdrop-blur-xl"
                : "border border-transparent"
            )}
          >
            <Link
              href="/"
              className="pressable rounded-full"
              aria-label="Cybersecurity 300L home"
            >
              <Wordmark size="md" />
            </Link>

            {/* ---------- Tabs ---------- */}
            <div
              ref={tabListRef}
              className="relative hidden h-full items-center lg:flex"
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
                      "pressable relative z-10 flex h-8 items-center rounded-full px-3.5 text-[13.5px] font-medium transition-colors",
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

                        {/* ---------- Countdown to the next class ----------
                The room this needs is why the theme switch moved out of the
                bar and floats below it. The compact flaps carry the digits;
                the course is always named rather than hidden behind a hover,
                because a countdown you cannot read at a glance is decoration. */}
            {next && (
              <Link
                href="/timetable"
                className="pressable group/cd hidden shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-2.5 pr-3 transition-colors hover:border-border-strong hover:bg-surface-hover md:flex"
                aria-label={`${next.inProgress ? "In progress" : "Next class"}: ${next.course.title}, ${next.course.code}, in ${countdown.text}`}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    next.inProgress ? "bg-accent" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
                <FlipClock ms={ms} size="nav" className="shrink-0" />
                {/* The course name needs about 150px that the tab row may not
                    have. Below that width the flaps alone still say what time
                    it is, and the label carries the rest, so the control is
                    never dropped entirely to save space. */}
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

            <button
              onClick={() => setOpen((v) => !v)}
              className="pressable -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Mobile ---------- */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--scrim)]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-0 border-b border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <Wordmark size="md" />
              <button
                onClick={() => setOpen(false)}
                className="pressable -mr-1 flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-surface-hover"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="mt-5 space-y-1">
              {TABS.map((t, i) => {
                const active = t.href === activeHref;
                return (
                  <li key={t.href} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
                    <Link
                      href={t.href}
                      className={cn(
                        "pressable flex items-center rounded-full px-4 py-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-accent/12 text-foreground"
                          : "text-foreground hover:bg-surface-hover"
                      )}
                    >
                      {t.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {next && (
              <Link
                href="/timetable"
                className="mt-4 flex items-center justify-between rounded-full border border-border px-4 py-3"
              >
                <span className="text-[13px] text-muted-foreground">
                  {next.inProgress ? "In progress" : next.course.title}
                </span>
                <span className="tnum font-mono text-[13px] font-semibold text-foreground">
                  {countdown.ready ? countdown.text : "--:--:--"}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
