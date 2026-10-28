"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import FlipClock from "@/components/FlipClock";
import { Wordmark } from "@/components/Wordmark";
import { useCountdown } from "@/hooks/useCountdown";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";
import { useStaffSession } from "@/components/StaffSession";
import { NotificationBell } from "@/components/NotificationBell";
import ThemeSlider from "@/components/ThemeSlider";
import type { Permission } from "@/lib/permissions";
import {
  PUBLIC_NAV_GROUPS,
  activePublicGroup,
  activePublicItem,
  navItemMatches,
  type NavGroup,
} from "@/lib/navigation";

const ADMIN_TABS: {
  href: string;
  label: string;
  permission?: Permission;
  exact?: boolean;
  superOnly?: boolean;
}[] = [
  { href: "/admin/attendance", label: "Attendance", permission: "attendance" },
  { href: "/admin/resources", label: "Resources", permission: "files" },
  { href: "/admin/roll", label: "Roll", permission: "roster" },
  { href: "/admin", label: "Staff", permission: "staff", exact: true },
  { href: "/admin/announce", label: "Announce", superOnly: true },
  { href: "/admin/bulletin", label: "Bulletin" },
  { href: "/admin/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, refresh } = useStaffSession();
  const isStaff = session?.isAdmin === true;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<NavGroup["id"] | null>(null);
  const [pinnedGroup, setPinnedGroup] = useState<NavGroup["id"] | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const groupButtons = useRef<Record<string, HTMLButtonElement | null>>({});

  const countdown = useCountdown();
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!countdown.ready) return;
    const [hours, minutes, seconds] = countdown.text.split(":").map(Number);
    setMs(
      ((hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0)) * 1000
    );
  }, [countdown.text, countdown.ready]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useDialogFocus({
    open: mobileOpen,
    panelRef: mobilePanelRef,
    triggerRef: mobileButtonRef,
    onClose: closeMobile,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setPinnedGroup(null);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const onChange = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
        setPinnedGroup(null);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const staffLinks = ADMIN_TABS.filter((item) => {
    if (!isStaff) return false;
    if (item.superOnly) return session?.role === "super";
    if (!item.permission) return true;
    return (
      session?.role === "super" ||
      session?.permissions?.includes(item.permission)
    );
  });

  const publicGroup = activePublicGroup(pathname);
  const publicItem = activePublicItem(pathname);
  const next = countdown.next;

  async function signOut() {
    await logout();
    await refresh();
    router.push("/");
    router.refresh();
  }

  function toggleGroup(id: NavGroup["id"]) {
    if (pinnedGroup === id) {
      setPinnedGroup(null);
      setOpenGroup(null);
    } else {
      setPinnedGroup(id);
      setOpenGroup(id);
    }
  }

  function focusMenuItem(group: NavGroup, position: "first" | "last") {
    window.requestAnimationFrame(() => {
      const menu = document.getElementById(`nav-menu-${group.id}`);
      const links = menu?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']");
      if (!links?.length) return;
      links[position === "first" ? 0 : links.length - 1]?.focus();
    });
  }

  function triggerKey(event: KeyboardEvent<HTMLButtonElement>, group: NavGroup) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpenGroup(group.id);
      focusMenuItem(group, event.key === "ArrowDown" ? "first" : "last");
    }
    if (event.key === "Escape") {
      setOpenGroup(null);
      setPinnedGroup(null);
    }
  }

  function itemKey(
    event: KeyboardEvent<HTMLAnchorElement>,
    group: NavGroup,
    index: number
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenGroup(null);
      setPinnedGroup(null);
      groupButtons.current[group.id]?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const menu = document.getElementById(`nav-menu-${group.id}`);
    const links = menu?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']");
    if (!links?.length) return;
    const delta = event.key === "ArrowDown" ? 1 : -1;
    links[(index + delta + links.length) % links.length]?.focus();
  }

  return (
    <>
      <header className="sticky top-0 z-40 h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative flex h-12 w-full min-w-0 items-center rounded-full px-1.5 sm:px-2 lg:px-4",
              "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
              scrolled
                ? "border border-border-strong bg-surface/90 shadow-lift backdrop-blur-xl"
                : "border border-transparent"
            )}
          >
            <Link
              href="/"
              aria-label="Cybersecurity 300L home"
              className={cn(
                "pressable inline-flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-full transition-[width,opacity] duration-300",
                scrolled
                  ? "w-0 opacity-0 sm:w-auto sm:opacity-100"
                  : "w-11 opacity-100 sm:w-auto",
                "max-xl:[&_[data-wordmark-text]]:hidden"
              )}
            >
              <Wordmark
                size="md"
                markClassName="h-[22px] w-[22px] lg:h-[30px] lg:w-[30px]"
              />
            </Link>

            <div className="min-w-0 flex-1" />

            {!isStaff ? (
              <nav
                ref={navRef}
                aria-label="Public pages"
                className="hidden h-full items-center gap-1 sm:flex"
              >
                {PUBLIC_NAV_GROUPS.map((group) => {
                  const active = publicGroup?.id === group.id;
                  const open = openGroup === group.id;
                  return (
                    <div
                      key={group.id}
                      className="relative flex h-full items-center"
                      onMouseEnter={() => setOpenGroup(group.id)}
                      onMouseLeave={() => {
                        if (pinnedGroup !== group.id) setOpenGroup(null);
                      }}
                      onFocus={() => setOpenGroup(group.id)}
                      onBlur={(event) => {
                        if (
                          pinnedGroup !== group.id &&
                          !event.currentTarget.contains(event.relatedTarget as Node)
                        ) {
                          setOpenGroup(null);
                        }
                      }}
                    >
                      <Link
                        href={group.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "pressable relative inline-flex h-9 items-center rounded-l-md pl-3 pr-1 text-[13px] font-medium transition-colors",
                          active
                            ? "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {group.label}
                      </Link>
                      <button
                        ref={(element) => {
                          groupButtons.current[group.id] = element;
                        }}
                        type="button"
                        aria-label={`Open ${group.label} menu`}
                        aria-expanded={open}
                        aria-controls={`nav-menu-${group.id}`}
                        onClick={() => toggleGroup(group.id)}
                        onKeyDown={(event) => triggerKey(event, group)}
                        className={cn(
                          "pressable grid h-9 w-7 place-items-center rounded-r-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground",
                          open && "bg-surface-hover text-foreground"
                        )}
                      >
                        <ChevronDown
                          size={13}
                          className={cn("transition-transform", open && "rotate-180")}
                        />
                      </button>

                      {open && (
                        <div
                          id={`nav-menu-${group.id}`}
                          role="menu"
                          aria-label={`${group.label} pages`}
                          className="absolute left-0 top-[calc(100%+0.45rem)] w-72 overflow-hidden rounded-xl border border-border-strong bg-surface-raised p-1.5 shadow-lift"
                        >
                          {group.children.map((item, index) => {
                            const current = publicItem?.href === item.href;
                            return (
                              <Link
                                key={item.href}
                                role="menuitem"
                                href={item.href}
                                aria-current={current ? "page" : undefined}
                                onKeyDown={(event) => itemKey(event, group, index)}
                                className={cn(
                                  "pressable block rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover",
                                  current && "bg-accent/10"
                                )}
                              >
                                <span
                                  className={cn(
                                    "block text-[13px] font-medium text-foreground",
                                    current && "underline decoration-accent decoration-2 underline-offset-4"
                                  )}
                                >
                                  {item.label}
                                </span>
                                {item.description && (
                                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                                    {item.description}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            ) : (
              <nav
                aria-label="Staff pages"
                className="hidden h-full min-w-0 flex-1 items-center overflow-x-auto sm:flex"
              >
                <div className="mx-auto flex w-max items-center">
                  {staffLinks.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "pressable relative flex h-9 shrink-0 items-center rounded-md px-3 text-[13px] font-medium",
                          active
                            ? "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}

            <button
              ref={mobileButtonRef}
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={isStaff ? "Open staff menu" : "Open all pages"}
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              aria-controls="mobile-page-menu"
              className="pressable ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground sm:hidden"
            >
              <Menu size={20} />
            </button>

            <NotificationBell />

            {isStaff && (
              <button
                type="button"
                onClick={signOut}
                className="pressable ml-1.5 inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground sm:h-9 sm:px-2.5"
              >
                Sign out
              </button>
            )}

            {next && (
              <Link
                href="/timetable"
                className="pressable ml-2 hidden shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 transition-colors hover:border-border-strong hover:bg-surface-hover sm:flex"
                aria-label={`${next.inProgress ? "In progress" : "Next class"}: ${next.course.title}, ${next.course.code}, in ${countdown.text}`}
                title={`${next.course.title} · ${next.course.code}`}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    next.inProgress ? "bg-accent" : "bg-muted"
                  )}
                />
                <FlipClock ms={ms} size="nav" className="shrink-0" />
                <span className="hidden font-mono text-[11px] text-foreground lg:block">
                  {next.course.code}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={closeMobile}
            className="fixed inset-0 z-40 cursor-default bg-background/75 backdrop-blur-sm sm:hidden"
          />
          <div
            ref={mobilePanelRef}
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
                onClick={closeMobile}
                aria-label="Close menu"
                className="pressable grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {next && (
              <Link
                href="/timetable"
                onClick={closeMobile}
                className="mt-2 flex min-h-11 items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-accent">
                    {next.inProgress ? "In progress" : "Next class"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] font-medium text-foreground">
                    {next.course.code} · {next.course.title}
                  </span>
                </span>
                <FlipClock ms={ms} size="dock" className="shrink-0" />
              </Link>
            )}

            <nav aria-label={isStaff ? "Staff pages" : "All pages"} className="mt-3">
              {!isStaff
                ? PUBLIC_NAV_GROUPS.map((group) => (
                    <div key={group.id} className="mt-3 first:mt-0">
                      <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        {group.label}
                      </p>
                      <div className="grid gap-0.5">
                        {group.children.map((item) => {
                          const active = navItemMatches(item, pathname);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              onClick={closeMobile}
                              className={cn(
                                "pressable flex min-h-11 items-center justify-between rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                                active && "bg-accent/10 font-semibold text-foreground"
                              )}
                            >
                              <span
                                className={cn(
                                  active &&
                                    "underline decoration-accent decoration-2 underline-offset-4"
                                )}
                              >
                                {item.label}
                              </span>
                              {active && (
                                <span className="text-[9px] uppercase tracking-[0.12em] text-accent">
                                  Current
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))
                : staffLinks.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={closeMobile}
                        className={cn(
                          "pressable flex min-h-11 items-center justify-between rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                          active && "bg-accent/10 font-semibold text-foreground"
                        )}
                      >
                        {item.label}
                        {active && (
                          <span className="text-[9px] uppercase tracking-[0.12em] text-accent">
                            Current
                          </span>
                        )}
                      </Link>
                    );
                  })}
            </nav>

            <div className="mt-3 border-t border-border pt-2">
              <div className="flex min-h-11 items-center justify-between gap-3 px-2.5">
                <span className="text-[13.5px] font-medium text-foreground">Theme</span>
                <ThemeSlider size="touch" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
