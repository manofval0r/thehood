"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FlipClock from "@/components/FlipClock";
import { Wordmark } from "@/components/Wordmark";
import { useCountdown } from "@/hooks/useCountdown";
import { formatRange } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";
import { useStaffSession } from "@/components/StaffSession";
import { NotificationBell } from "@/components/NotificationBell";
import type { Permission } from "@/lib/permissions";

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

const TABS: { href: string; label: string; exact?: boolean }[] = [
  // The home page is the courses, and it is matched exactly. Every path in
  // the site starts with a slash, so a prefix match on "/" lights the first
  // tab on every page, and the pill never moves off it.
  { href: "/", label: "Courses", exact: true },
  { href: "/timetable", label: "Timetable" },
  { href: "/timeline", label: "Calendar" },
  { href: "/registration", label: "Registration" },
  { href: "/resources", label: "Resources" },
  { href: "/careers", label: "Careers" },
  { href: "/events", label: "Events" },
];

/**
 * The links a member of staff gets instead.
 *
 * The student links are not needed to run the roll, and the staff area is
 * split into pages rather than being one long page, so each of these is a
 * place of its own. A link appears only if that person holds the permission
 * it needs, which is the same rule the server actions enforce.
 */
const ADMIN_TABS: {
  href: string;
  label: string;
  permission: Permission;
  /** Match the path exactly, so "Staff" is not lit while on a sub-page. */
  exact?: boolean;
}[] = [
  { href: "/admin/attendance", label: "Attendance", permission: "attendance" },
  { href: "/admin/files", label: "Files", permission: "files" },
  { href: "/admin/roll", label: "Roll", permission: "roster" },
  { href: "/admin", label: "Staff", permission: "staff", exact: true },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
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

  /**
   * Whether a member of staff is signed in.
   *
   * The bar changes for them: the student links are not what they need, and
   * the staff area is a set of pages rather than one long one. The answer
   * comes from the shared session, which is asked for once and refreshed
   * after signing in or out.
   */
  const { session, refresh } = useStaffSession();

  const isStaff = session?.isAdmin === true;

  /**
   * Signing out.
   *
   * The cookie goes, and then the bar has to be told, because it decides
   * which links to show from what it was told last. Without the refresh the
   * bar would go on showing the staff links to somebody who is no longer
   * signed in, which is both wrong and confusing.
   */
  async function signOut() {
    await logout();
    await refresh();
    router.push("/");
    router.refresh();
  }

  /** The links this bar shows: the staff ones if signed in, else the student's. */
  const links: { href: string; label: string; exact?: boolean }[] = isStaff
    ? ADMIN_TABS.filter(
        (t) =>
          session?.role === "super" ||
          session?.permissions?.includes(t.permission)
      ).map((t) => ({ href: t.href, label: t.label, exact: t.exact }))
    : TABS;

  const activeHref = links.find((t) =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href)
  )?.href;

  // The set of links, as a string, so the pill is measured again when the
  // links change rather than only when the path does.
  const linkKey = links.map((t) => t.href).join("|");

  /**
   * Measure the active link's real box rather than assuming it is centred.
   * Positioning the pill from the viewport centre was why it sat a few pixels
   * off the word it was meant to mark, and why it drifted when the row height
   * changed.
   *
   * The measurement is taken again whenever the row changes shape, and the
   * row changes shape more often than it looks: the web font arrives after
   * the first paint and the words get wider, the window changes, and the
   * links change from the student's to the staff's when somebody signs in.
   * A pill measured once and left there points at the wrong word.
   */
  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;

    let frame = 0;

    const measure = () => {
      const el = activeHref
        ? list.querySelector<HTMLElement>(`[data-href="${activeHref}"]`)
        : null;

      if (!el) {
        if (activeHref) {
          // The link is not in the row yet, which happens for a frame while
          // the page is settling. Try again rather than hiding the pill and
          // leaving it in the wrong place.
          frame = requestAnimationFrame(measure);
          return;
        }
        // There is no tab for this page, such as a file being viewed. The
        // pill goes rather than marking the wrong link.
        setPill((p) => (p.ready ? { ...p, ready: false } : p));
        return;
      }

      setPill({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        ready: true,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, [activeHref, linkKey]);

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
              "relative flex h-12 w-full items-center justify-between rounded-full",
              // Even padding, and closer to the edge on a phone. The bar was
              // 16px on the left and 8px on the right, which read as
              // lopsided, and on a phone the mark was pushed in far enough
              // that the link rail had almost nothing left. Eight pixels
              // either side, and the words get their room back on a desktop
              // where there is space for it.
              "pl-2 pr-2 lg:pl-4",
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
              {/* The mark is smaller on a phone. Every pixel it gives up is a
                  pixel the link rail has, and at this size the difference
                  between a twenty-two pixel mark and a thirty pixel one is
                  the difference between three links and two. */}
              <Wordmark
                size="md"
                markClassName="h-[22px] w-[22px] lg:h-[30px] lg:w-[30px]"
              />
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
                // The links sit in the space between the wordmark and the
                // countdown and are centred in whatever is left. An earlier
                // version took them out of the flow and centred them on the
                // whole bar instead, which looked right until there were
                // enough of them: the group grew until it ran into the
                // countdown, and a bar whose links overlap the clock is
                // worse than one whose links are not quite on the centre
                // line. Centred in the gap, they cannot reach the clock at
                // any width, and they scroll when the gap is too small.
                //
                // h-full so the rail is the height of the bar rather than the
                // height of a link. The extra room is what the scrollbar
                // sits in, and without it the bar would be clipped by three
                // pixels the moment there is something to scroll.
                "flex h-full items-center",
                "nav-rail",
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
                    lozenge and swallows the word it is meant to mark.

                    It is a tablet-and-up affordance. On a phone the rail is
                    barely wider than two links, and a filled panel behind the
                    active one eats the space the words need. Below md the
                    active link marks itself with an underline instead. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    // top-0/left-0 pin the origin to the container's padding box.
                    // Without it the absolutely positioned box takes its static
                    // position from `align-items: center`, which already sits it
                    // 7px down, and the measured translate is applied on top of
                    // that, doubling the offset.
                    "pointer-events-none absolute left-0 top-0 hidden rounded-lg bg-accent/14 ring-1 ring-inset ring-accent/30 md:block",
                    "transition-[transform,opacity] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                    pill.ready ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
                    width: pill.width,
                    height: pill.height,
                  }}
                />

                {links.map((t) => {
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
                          : "text-muted-foreground hover:text-foreground",
                        // On a phone the active link marks itself. The pill is
                        // a tablet-and-up affordance, and the rail scrolls on
                        // a phone, so a shared indicator would be sitting
                        // somewhere off the edge of the screen most of the
                        // time. This one belongs to the link, so it is always
                        // under its own word. It is a line rather than a
                        // block because a block would eat the width the
                        // words need.
                        active &&
                          "after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-accent after:content-[''] md:after:hidden"
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ---------- The bell ----------
                What has changed, and the settings for what to be told about.
                It is the only way into the notification panel, and it sits
                beside the countdown because both are answers to "what is
                happening now". */}
            <NotificationBell />

            {/* ---------- Sign out ----------
                Only for a member of staff, and only when the bar is showing
                the staff links, because it belongs with them. The student
                bar has nothing to sign out of. */}
            {isStaff && (
              <button
                type="button"
                onClick={signOut}
                className="pressable ml-1.5 shrink-0 rounded-full border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:ml-2"
              >
                Sign out
              </button>
            )}

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

                {/* The course code, and nothing else. The title used to sit
                    here on a second line, and it was the single widest thing
                    in the bar: it pushed the links towards the countdown and
                    the countdown towards the edge. The code says which class
                    is being counted down to; the rest of it is one hover
                    away, where it does not cost anything until somebody
                    asks for it. */}
                <span className="hidden shrink-0 font-mono text-[11px] leading-none text-foreground lg:block">
                  {next.course.code}
                </span>

                {/* What the code used to say, on hover and on focus. It is
                    the same information the label carries for a screen
                    reader, so nothing is hidden from anybody. */}
                <span
                  className={cn(
                    "pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-lg border border-border bg-surface-raised p-3 text-left opacity-0 shadow-lift",
                    "translate-y-1 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    "group-hover/cd:translate-y-0 group-hover/cd:opacity-100 group-focus-within/cd:translate-y-0 group-focus-within/cd:opacity-100"
                  )}
                  aria-hidden="true"
                >
                  <span className="block text-[13px] font-semibold leading-snug text-foreground">
                    {next.course.title}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                    <span className="font-mono text-foreground">
                      {next.course.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {next.course.dayName},{" "}
                      {formatRange(next.course.startMin, next.course.endMin)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{next.course.venue}</span>
                  </span>
                  <span className="mt-2 block border-t border-border pt-2 text-[11.5px] text-muted">
                    {next.inProgress ? "In progress now" : "Starts in"}{" "}
                    <span className="font-mono text-foreground">
                      {countdown.text}
                    </span>
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
