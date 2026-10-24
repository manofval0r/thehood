"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import FlipClock from "@/components/FlipClock";
import { Wordmark } from "@/components/Wordmark";
import { useCountdown } from "@/hooks/useCountdown";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { breakFor, breakPhrase } from "@/lib/breaks";
import { useBreaks } from "@/components/ScheduleProvider";
import { formatRange } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";
import { useStaffSession } from "@/components/StaffSession";
import { NotificationBell } from "@/components/NotificationBell";
import ThemeSlider from "@/components/ThemeSlider";
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
  { href: "/admin/resources", label: "Resources", permission: "files" },
  { href: "/admin/roll", label: "Roll", permission: "roster" },
  { href: "/admin", label: "Staff", permission: "staff", exact: true },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });
  const [fontsReady, setFontsReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useDialogFocus({
    open: menuOpen,
    panelRef: menuPanelRef,
    triggerRef: menuButtonRef,
    onClose: closeMenu,
  });

  // The menu only exists below the tablet breakpoint. If a phone is turned
  // or resized into the desktop bar while it is open, close it rather than
  // leaving a hidden dialog holding the page scroll and the focus trap.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const onChange = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  // The web font arrives after the first paint, and the words get wider when
  // it does. The pill is measured against the row, so until the font has
  // landed it would be measured against the wrong row and would sit on the
  // wrong word. Waiting for the font is what keeps it from flashing onto
  // the wrong link when a reader opens the site straight onto a page.
  useEffect(() => {
    let live = true;
    document.fonts?.ready
      .then(() => {
        if (live) setFontsReady(true);
      })
      .catch(() => {
        if (live) setFontsReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const countdown = useCountdown();
  const breaks = useBreaks();

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

  /**
   * The links this bar shows: the staff ones if signed in, else the student's.
   *
   * Settings belongs to every member of staff, not to one permission, so it
   * is added rather than filtered. Announce is the one page a super admin
   * alone has: a message to every student.
   */
  const links: { href: string; label: string; exact?: boolean }[] = session
    ? isStaff
      ? [
          ...ADMIN_TABS.filter(
            (t) =>
              session?.role === "super" ||
              session?.permissions?.includes(t.permission)
          ).map((t) => ({ href: t.href, label: t.label, exact: t.exact })),
          ...(session?.role === "super"
            ? [{ href: "/admin/announce", label: "Announce" }]
            : []),
          { href: "/admin/settings", label: "Settings" },
        ]
      : TABS
    : [];

  const activeHref = links.find((t) =>
    t.exact ? pathname === t.href : pathname.startsWith(t.href)
  )?.href;

  // The sheet keeps every destination in one place. For a visitor it is the
  // full public list; for a member of staff it is the permitted staff list.
  // A session still being looked up shows the public list rather than an
  // empty menu.
  const menuLinks = isStaff ? links : TABS;
  const menuActiveHref = menuLinks.find((t) =>
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

      // Bring the active link into view.
      //
      // The rail scrolls when there are more links than fit, and there are
      // eight of them for a super admin on a laptop. The link you are on
      // can be past the end of the rail, and then the bar is saying you
      // are somewhere you cannot see.
      const rail = list.parentElement;
      if (!rail) return;
      if (rail.scrollWidth <= rail.clientWidth) return;

      const link = el.getBoundingClientRect();
      const box = rail.getBoundingClientRect();
      if (link.right > box.right) {
        rail.scrollLeft += link.right - box.right + 12;
      } else if (link.left < box.left) {
        rail.scrollLeft -= box.left - link.left + 12;
      }
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

  // When the lecture has a break in it, and when.
  const breakNote = next
    ? breakPhrase(
        next.course.startMin,
        next.course.endMin,
        breakFor(
          breaks,
          next.course.code,
          next.course.dayIndex,
          next.course.startMin
        )
      )
    : "";

  return (
    <>
      <header className="sticky top-0 z-40 h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative flex h-12 w-full min-w-0 items-center rounded-full",
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
            <nav
              aria-label={isStaff ? "Staff pages" : "Public pages"}
              className={cn(
                // Phone: a rail that takes the leftover width and scrolls.
                // min-w-0 matters: without it a flex child refuses to shrink
                // below its content, and the wide link row becomes document
                // overflow instead of staying inside the rail.
                "relative h-full min-w-0 flex-1",
                // A member of staff gets a labelled menu instead of a rail.
                // Their destinations are task-oriented and six of them do
                // not fit; an invisible scroll is the wrong affordance.
                isStaff && "max-sm:hidden"
              )}
            >
              <div className="nav-rail flex h-full w-full items-center overflow-x-auto overscroll-x-contain">
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
                    pill.ready && fontsReady ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
                    width: pill.width,
                    height: pill.height,
                  }}
                />

                {links.map((t, index) => {
                  const active = t.href === activeHref;
                  return (
                    <Link
                      key={t.href}
                      data-href={t.href}
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        // The phone gets a 44px target and a tighter
                        // horizontal padding. The row shows complete labels
                        // rather than a cut-off word: the third destination
                        // waits for a width where it fits, and everything
                        // past the row lives in the labelled sheet.
                        "pressable relative z-10 flex h-11 shrink-0 items-center rounded-full px-2 text-[13px] font-medium transition-colors sm:h-8 sm:px-3 sm:text-[13.5px]",
                        // Public phone row: Courses and Timetable, plus
                        // Calendar when there is room for it. The rest are
                        // one tap away in More. Desktop keeps the full rail.
                        !isStaff && index >= 3 && "max-sm:hidden",
                        !isStaff && index === 2 && "max-[389px]:hidden",
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
                          "after:absolute after:inset-x-2 after:bottom-1.5 after:h-px after:bg-accent after:content-[''] sm:after:inset-x-3 sm:after:bottom-1 md:after:hidden"
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
                </div>
              </div>
              {/* The fade is the rail's visible edge: it says the row
                  continues even when the scrollbar is hidden. The labelled
                  button beside it is the reliable way in, especially for a
                  reader who cannot or does not want to swipe. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-background to-transparent sm:hidden"
              />
            </nav>

            {/* ---------- Phone overflow control ----------
                Every public destination stays in the rail, and the sheet is a
                second, reliable way to reach all of them. For staff the rail
                is replaced by this control on a phone because their six
                destinations are tasks rather than a reading path. */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={isStaff ? "Open staff menu" : "Open all pages"}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-page-menu"
              className={cn(
                "pressable grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:hidden",
                isStaff ? "ml-auto" : "ml-1",
                menuOpen && "border-accent/50 text-foreground"
              )}
            >
              {isStaff ? "Menu" : "More"}
            </button>

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
                className="pressable ml-1.5 inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:ml-2 sm:h-8 sm:px-2.5"
              >
                Sign out
              </button>
            )}

            {/* ---------- Countdown ----------
                Pinned to the end of the bar, outside the link scroller. */}
            {next && (
              <Link
                href="/timetable"
                className="pressable group/cd ml-1.5 flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-2 pr-2.5 transition-colors hover:border-border-strong hover:bg-surface-hover sm:ml-2 sm:gap-2 sm:pl-2.5 sm:pr-3 hidden sm:flex"
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
                  {breakNote && (
                    <span className="mt-1.5 block text-[11.5px] text-muted">
                      {breakNote}
                    </span>
                  )}
                  <span className="mt-2 block border-t border-border pt-2 text-[11.5px] text-muted">
                    {countdown.phase === "in-break"
                      ? "On a break, ends in"
                      : countdown.phase === "to-break"
                        ? "Break in"
                        : countdown.next?.inProgress
                          ? "In progress now, ends in"
                          : "Starts in"}{" "}
                    <span className="font-mono text-foreground">
                      {countdown.text}
                    </span>
                  </span>

                  {/* And what is after it. A reader sitting in a class
                      wants to know what is next, not only how long this one
                      has left, and a class that has not started yet has a
                      class after it as well. */}
                  {countdown.following && (
                    <span className="mt-2 block border-t border-border pt-2 text-[11.5px] text-muted">
                      <span className="block text-[10.5px] uppercase tracking-[0.1em] text-muted">
                        Then
                      </span>
                      <span className="mt-0.5 block font-medium text-foreground">
                        {countdown.following.course.title}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]">
                        <span className="font-mono text-foreground">
                          {countdown.following.course.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {countdown.following.isToday
                            ? "today"
                            : countdown.following.course.dayName}
                          ,{" "}
                          {formatRange(
                            countdown.following.course.startMin,
                            countdown.following.course.endMin
                          )}
                        </span>
                      </span>
                    </span>
                  )}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          {/* The backdrop covers the bar too, so a second panel cannot be
              opened on top of this one. The sheet's own close control is the
              way out, and Escape does the same from the keyboard. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={closeMenu}
            className="fixed inset-0 z-40 cursor-default bg-background/70 backdrop-blur-[2px] sm:hidden"
          />
          <div
            ref={menuPanelRef}
            id="mobile-page-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            tabIndex={-1}
            className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border-strong bg-surface-raised px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-lift sm:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <p
                id="mobile-menu-title"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
              >
                {isStaff ? "Staff menu" : "All pages"}
              </p>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label={isStaff ? "Staff pages" : "All pages"}>
              <div className="mt-1 grid gap-0.5">
                {menuLinks.map((t) => {
                  const active = t.href === menuActiveHref;
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMenu}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[13.5px] transition-colors hover:bg-surface-hover",
                        active
                          ? "bg-accent/10 font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          active &&
                            "underline decoration-accent decoration-2 underline-offset-4"
                        )}
                      >
                        {t.label}
                      </span>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent"
                        >
                          Current
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* The phone's theme switch. It lives here because the bottom
                corner is content, and it is a 44px control because it is
                still a control on a touch screen. */}
            <div className="mt-2 border-t border-border pt-2">
              <div className="flex min-h-11 items-center justify-between gap-3 px-2.5">
                <span className="text-[13.5px] font-medium text-foreground">
                  Theme
                </span>
                <ThemeSlider size="touch" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}