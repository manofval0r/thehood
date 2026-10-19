"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import ThemeToggle from "@/components/ThemeToggle";
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
  const measureRef = useRef<HTMLSpanElement>(null);

  // Measure the collapsed title once per course so the reveal animates to a
  // width that actually fits it.
  const [revealWidth, setRevealWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (el) setRevealWidth(Math.ceil(el.getBoundingClientRect().width) + 14);
  }, [countdown.next?.course.code, countdown.ready]);

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
              className="relative hidden h-full items-center md:flex"
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

            {/* ---------- Light / dark ---------- */}
            <ThemeToggle className="ml-3" />

            {/* ---------- Countdown to the next class ---------- */}
            {next && (
              <Link
                href="/timetable"
                className="pressable group/cd hidden shrink-0 items-center gap-2.5 overflow-hidden rounded-full border border-border py-1 pl-3 pr-3.5 transition-colors hover:border-border-strong hover:bg-surface-hover lg:flex"
                aria-label={`Next class: ${next.course.title} in ${countdown.text}`}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    next.inProgress ? "bg-accent" : "bg-muted"
                  )}
                />
                <span className="text-[12px] text-muted-foreground">
                  {next.inProgress ? "In progress" : "Next class"}
                </span>
                <span className="tnum font-mono text-[13px] font-semibold tracking-tight text-foreground">
                  {countdown.ready ? countdown.text : "--:--:--"}
                </span>
                {/* Reveals the course on hover by animating max-width.

                    A 0fr -> 1fr grid column cannot do this here: the grid is
                    a flex item, so fr resolves against flex sizing and stays
                    zero. Measuring is only possible from an unclipped copy,
                    so one is rendered hidden and its width drives the
                    transition. That keeps the pill sized to the actual title
                    instead of a guessed constant that would clip or gap. */}
                <span
                  className="grid overflow-hidden transition-[max-width] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)] max-w-0 group-hover/cd:max-w-[var(--reveal,20rem)] motion-reduce:transition-none"
                  aria-hidden="true"
                  style={{ "--reveal": `${revealWidth ?? 320}px` } as CSSProperties}
                >
                  <span className="block whitespace-nowrap pl-2.5 text-[12.5px] text-foreground">
                    <span className="font-mono font-bold text-accent">
                      {next.course.code}
                    </span>
                    <span className="mx-1.5 text-muted">/</span>
                    {next.course.title}
                  </span>
                </span>
                {/* Off-screen twin used only for measurement. */}
                <span
                  ref={measureRef}
                  aria-hidden="true"
                  className="pointer-events-none invisible absolute whitespace-nowrap text-[12.5px]"
                >
                  <span className="font-mono font-bold">
                    {next.course.code}
                  </span>
                  <span className="mx-1.5">/</span>
                  {next.course.title}
                </span>
              </Link>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              className="pressable -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover md:hidden"
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
        <div className="fixed inset-0 z-50 md:hidden">
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
