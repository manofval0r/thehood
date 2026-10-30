"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  Mail,
  Megaphone,
  Menu,
  Radio,
  Settings2,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import FlipClock from "@/components/FlipClock";
import { Wordmark } from "@/components/Wordmark";
import { useCountdown } from "@/hooks/useCountdown";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/actions";
import { useStaffSession } from "@/components/StaffSession";
import { NotificationBell } from "@/components/NotificationBell";
import ThemeSlider from "@/components/ThemeSlider";
import { COURSES } from "@/lib/resources";
import type { Permission } from "@/lib/permissions";
import {
  NAV_GROUP_QUICK_LINKS,
  NAV_GROUP_TAGLINES,
  PUBLIC_NAV_GROUPS,
  activePublicGroup,
  activePublicItem,
  navItemMatches,
  type NavGroup,
} from "@/lib/navigation";

/**
 * The desktop navigation opens one full-width mega panel below the navbar
 * instead of a small dropdown per group. The panel never moves: every trigger
 * opens the same panel and the content slides between groups, so the eye has
 * one place to look. The staff nav keeps its flat quick bar and gains a Pages
 * trigger that opens the same panel with the admin tools and the public
 * pages, because signing out to reach the timetable is a broken path.
 */

type PanelId = NavGroup["id"] | "pages";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const PANEL_ORDER: PanelId[] = ["courses", "study", "campus", "pages"];

type IconType = ComponentType<{ size?: number; className?: string }>;

const NAV_ITEM_ICONS: Record<string, IconType> = {
  "/": GraduationCap,
  "/timetable": CalendarDays,
  "/assessments": ClipboardCheck,
  "/registration": FileCheck2,
  "/tools": Wrench,
  "/resources": BookOpen,
  "/bulletin": Radio,
  "/timeline": CalendarRange,
  "/events": Trophy,
  "/careers": Briefcase,
  "/contact": Mail,
};

const ADMIN_ITEM_ICONS: Record<string, IconType> = {
  "/admin/attendance": ClipboardList,
  "/admin/resources": FolderOpen,
  "/admin/roll": Users,
  "/admin": UserCog,
  "/admin/announce": Megaphone,
  "/admin/bulletin": Radio,
  "/admin/settings": Settings2,
};

const ADMIN_TABS: {
  href: string;
  label: string;
  description: string;
  permission?: Permission;
  exact?: boolean;
  superOnly?: boolean;
}[] = [
  { href: "/admin/attendance", label: "Attendance", description: "Mark and review class attendance", permission: "attendance" },
  { href: "/admin/resources", label: "Resources", description: "Course files, folders and videos", permission: "files" },
  { href: "/admin/roll", label: "Roll", description: "The registered student roster", permission: "roster" },
  { href: "/admin", label: "Staff", description: "Accounts, roles and permissions", permission: "staff", exact: true },
  { href: "/admin/announce", label: "Announce", description: "Push a notification to the cohort", superOnly: true },
  { href: "/admin/bulletin", label: "Bulletin", description: "Draft, publish and pin notices" },
  { href: "/admin/settings", label: "Settings", description: "Calendar connection and overrides" },
];

/**
 * One menu cell: icon, label, description. Shared by every panel section.
 * Defined at module level so it is never recreated during render.
 */
function MegaItem({
  href,
  label,
  description,
  icon: Icon,
  current,
  index,
  onNavigate,
  onItemKeyDown,
}: {
  href: string;
  label: string;
  description?: string;
  icon: IconType;
  current?: boolean;
  index: number;
  onNavigate: () => void;
  onItemKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.18, delay: 0.04 + index * 0.026, ease: EASE } }}
      className="min-w-0"
    >
      <Link
        role="menuitem"
        href={href}
        onClick={onNavigate}
        onKeyDown={onItemKeyDown}
        aria-current={current ? "page" : undefined}
        className={cn(
          "pressable flex min-h-11 items-start gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-hover",
          current && "bg-accent/10"
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border",
            current ? "border-accent/40 text-accent" : "border-border text-muted-foreground"
          )}
          aria-hidden="true"
        >
          <Icon size={15} />
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block text-[13px] font-medium text-foreground",
              current && "underline decoration-accent decoration-2 underline-offset-4"
            )}
          >
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
              {description}
            </span>
          )}
        </span>
      </Link>
    </motion.div>
  );
}

/** The shared trigger pair: label link plus chevron button. */
function Trigger({
  panel,
  label,
  href,
  active,
  open,
  icon: Icon,
  onNavigate,
  onToggle,
  onTriggerKey,
  buttonRef,
}: {
  panel: string;
  label: string;
  href: string;
  active: boolean;
  open: boolean;
  icon?: IconType;
  onNavigate: () => void;
  onToggle: () => void;
  onTriggerKey: (event: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <div className="flex h-full items-center">
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "pressable relative inline-flex h-9 items-center gap-1.5 rounded-l-md pl-3 pr-1 text-[13px] font-medium transition-colors",
          active
            ? "font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {Icon && <Icon size={13} />}
        {label}
      </Link>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Open ${label} menu`}
        aria-expanded={open}
        aria-controls={open ? `nav-mega-${panel}` : undefined}
        onClick={onToggle}
        onKeyDown={onTriggerKey}
        className={cn(
          "pressable grid h-9 w-7 place-items-center rounded-r-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground",
          open && "bg-surface-hover text-foreground"
        )}
      >
        <ChevronDown
          size={13}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, refresh } = useStaffSession();
  const isStaff = session?.isAdmin === true;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [pinnedPanel, setPinnedPanel] = useState<PanelId | null>(null);
  const [slideDir, setSlideDir] = useState(0);
  const closeTimer = useRef<number | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const triggerButtons = useRef<Record<string, HTMLButtonElement | null>>({});

  const countdown = useCountdown();
  const [hours, minutes, seconds] = countdown.text.split(":").map(Number);
  const ms = countdown.ready
    ? ((hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0)) * 1000
    : 0;

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
    const desktop = window.matchMedia("(min-width: 640px)");
    const onChange = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  // The mega panel belongs to the page: menu links close it on click, so no
  // pathname effect is needed here.
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!pillRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
        setPinnedPanel(null);
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

  /** The panel that should currently be shown, if any. */
  const panelId: PanelId | null = pinnedPanel ?? openPanel;

  function openWithDirection(id: PanelId) {
    const from = panelId ? PANEL_ORDER.indexOf(panelId) : -1;
    const to = PANEL_ORDER.indexOf(id);
    setSlideDir(from === -1 || from === to ? 0 : to > from ? 1 : -1);
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenPanel(id);
  }

  /** Close on leave, but only after a beat so crossing the panel gap survives. */
  function schedulePanelClose() {
    if (pinnedPanel) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setOpenPanel((current) => (pinnedPanel ? current : null));
    }, 160);
  }

  function cancelPanelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function togglePinned(id: PanelId) {
    if (pinnedPanel === id) {
      setPinnedPanel(null);
      setOpenPanel(null);
    } else {
      setPinnedPanel(id);
      setOpenPanel(id);
    }
  }

  function closePanel() {
    setOpenPanel(null);
    setPinnedPanel(null);
  }

  function focusPanelItem(panel: PanelId, position: "first" | "last") {
    window.requestAnimationFrame(() => {
      const menu = document.getElementById(`nav-mega-${panel}`);
      const links = menu?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']");
      if (!links?.length) return;
      links[position === "first" ? 0 : links.length - 1]?.focus();
    });
  }

  function triggerKey(event: KeyboardEvent<HTMLButtonElement>, panel: PanelId) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openWithDirection(panel);
      window.setTimeout(() => focusPanelItem(panel, event.key === "ArrowDown" ? "first" : "last"), 0);
    }
    if (event.key === "Escape") {
      closePanel();
    }
  }

  function itemKey(event: KeyboardEvent<HTMLAnchorElement>, panel: PanelId) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      triggerButtons.current[panel]?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const menu = document.getElementById(`nav-mega-${panel}`);
    const links = menu?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']");
    if (!links?.length) return;
    const list = Array.from(links);
    const current = list.indexOf(document.activeElement as HTMLAnchorElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    list[(Math.max(current, 0) + delta + list.length) % list.length]?.focus();
  }

  /** The live next-class chip, reused from the navbar's countdown data. */
  const nextClassChip = next ? (
    <Link
      href="/timetable"
      onClick={closePanel}
      role="menuitem"
      onKeyDown={(event) => panelId && itemKey(event, panelId)}
      className="pressable flex min-h-11 items-center justify-between gap-2 rounded-lg border border-accent/25 bg-accent/5 px-2.5 py-1.5"
      aria-label={`${next.inProgress ? "In progress" : "Next class"}: ${next.course.title}, ${next.course.code}, in ${countdown.text}`}
    >
      <span className="min-w-0">
        <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
          {next.inProgress ? "In progress" : "Next class"}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-foreground">
          {next.course.code}
        </span>
      </span>
      <FlipClock ms={ms} size="dock" className="shrink-0" />
    </Link>
  ) : null;

  /**
   * The mega panel itself. Rendered at pill level so it always spans the full
   * navbar content width, whichever trigger opened it.
   */
  const megaPanel = panelId ? (
    <motion.div
      key="mega-panel"
      id={`nav-mega-${panelId}`}
      role="menu"
      aria-label={panelId === "pages" ? "All pages" : `${panelId} pages`}
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.99 }}
      transition={{ duration: 0.22, ease: EASE }}
      style={{ transformOrigin: "top center" }}
      onMouseEnter={cancelPanelClose}
      className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-border-strong bg-surface-raised shadow-lift"
    >
      {panelId === "pages" ? (
        /* The staff panel: admin tools plus the public pages. */
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr_15rem]">
          <section aria-label="Staff tools" className="min-w-0">
            <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Staff tools
            </p>
            <div className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {staffLinks.map((item, index) => (
                <MegaItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  icon={ADMIN_ITEM_ICONS[item.href] ?? ShieldCheck}
                  current={
                    item.exact ? pathname === item.href : pathname.startsWith(`${item.href}/`)
                  }
                  index={index}
                  onNavigate={closePanel}
                  onItemKeyDown={(event) => itemKey(event, "pages")}
                />
              ))}
            </div>
          </section>
          <section aria-label="Public pages" className="min-w-0">
            <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Browse
            </p>
            <div className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {PUBLIC_NAV_GROUPS.flatMap((group) => group.children)
                .slice(0, 8)
                .map((item, index) => (
                  <MegaItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    description={item.description}
                    icon={NAV_ITEM_ICONS[item.href] ?? GraduationCap}
                    current={publicItem?.href === item.href}
                    index={index}
                    onNavigate={closePanel}
                    onItemKeyDown={(event) => itemKey(event, "pages")}
                  />
                ))}
            </div>
          </section>
          <aside className="hidden flex-col gap-3 border-l border-border pl-5 lg:flex">
            {nextClassChip}
          </aside>
        </div>
      ) : (
        /* A public group: its pages in a grid plus the quick rail. */
        (() => {
          const group = PUBLIC_NAV_GROUPS.find((g) => g.id === panelId);
          if (!group) return null;
          const quick = NAV_GROUP_QUICK_LINKS[group.id];
          return (
            <div className="grid gap-6 p-5 lg:grid-cols-[1fr_15rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: slideDir * 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slideDir * -12 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  className="min-w-0"
                >
                <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {group.label}
                </p>
                <p className="px-2.5 pb-3 text-[12.5px] text-muted-foreground">
                  {NAV_GROUP_TAGLINES[group.id]}
                </p>
                <div className="grid gap-0.5 sm:grid-cols-2">
                  {group.children.map((item, index) => (
                    <MegaItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      icon={NAV_ITEM_ICONS[item.href] ?? GraduationCap}
                      current={publicItem?.href === item.href}
                      index={index}
                      onNavigate={closePanel}
                      onItemKeyDown={(event) => itemKey(event, group.id)}
                    />
                  ))}
                </div>
                </motion.div>
              </AnimatePresence>

              <aside className="hidden flex-col gap-4 border-l border-border pl-5 lg:flex">
                {nextClassChip}
                {group.id === "courses" ? (
                  <div>
                    <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Jump to course
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {COURSES.map((course, index) => (
                        <motion.div
                          key={course.slug}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.16, delay: 0.1 + index * 0.02, ease: EASE } }}
                        >
                          <Link
                            role="menuitem"
                            href={`/courses/${course.slug}`}
                            onClick={closePanel}
                            onKeyDown={(event) => itemKey(event, "courses")}
                            aria-current={pathname === `/courses/${course.slug}` ? "page" : undefined}
                            className={cn(
                              "pressable inline-flex min-h-9 items-center rounded-md border border-border px-2 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground",
                              pathname === `/courses/${course.slug}` && "border-accent/50 text-accent"
                            )}
                          >
                            {course.code}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Quick access
                    </p>
                    <div className="grid gap-0.5">
                      {quick.map((entry, index) => (
                        <motion.div
                          key={entry.href}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.16, delay: 0.1 + index * 0.03, ease: EASE } }}
                        >
                          <Link
                            role="menuitem"
                            href={entry.href}
                            onClick={closePanel}
                            onKeyDown={(event) => itemKey(event, group.id)}
                            className={cn(
                              "pressable block min-h-11 rounded-md px-2.5 py-1.5 transition-colors hover:bg-surface-hover",
                              publicItem?.href === entry.href && "bg-accent/10"
                            )}
                          >
                            <span className="block text-[12.5px] font-medium text-foreground">
                              {entry.label}
                            </span>
                            <span className="block text-[11px] text-muted">{entry.hint}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          );
        })()
      )}
    </motion.div>
  ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <header className="sticky top-0 z-40 h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div
            ref={pillRef}
            className={cn(
              "relative flex h-12 w-full min-w-0 items-center rounded-full px-1.5 sm:px-2 lg:px-4",
              "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
              scrolled
                ? "border border-border-strong bg-surface/90 shadow-lift backdrop-blur-xl"
                : "border border-transparent"
            )}
            onKeyDown={(event) => {
              if (event.key === "Escape") closePanel();
            }}
            onMouseLeave={schedulePanelClose}
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
                aria-label="Public pages"
                className="hidden h-full items-center gap-1 sm:flex"
              >
                {PUBLIC_NAV_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    onMouseEnter={() => openWithDirection(group.id)}
                  >
                    <Trigger
                      panel={group.id}
                      label={group.label}
                      href={group.href}
                      active={publicGroup?.id === group.id}
                      open={panelId === group.id}
                      onNavigate={closePanel}
                      onToggle={() => togglePinned(group.id)}
                      onTriggerKey={(event) => triggerKey(event, group.id)}
                      buttonRef={(element) => {
                        triggerButtons.current[group.id] = element;
                      }}
                    />
                  </div>
                ))}
              </nav>
            ) : (
              <>
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
                            "pressable relative flex min-h-[44px] h-auto shrink-0 items-center rounded-xl px-3.5 text-[13px] font-medium transition-colors duration-150",
                            active
                              ? "font-semibold text-foreground bg-accent/10 after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[3px] after:rounded-full after:bg-accent shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
                <div
                  className="hidden h-full items-center sm:flex"
                  onMouseEnter={() => openWithDirection("pages")}
                >
                  <Trigger
                    panel="pages"
                    label="Pages"
                    href="/admin"
                    icon={LayoutGrid}
                    active={pathname.startsWith("/admin")}
                    open={panelId === "pages"}
                    onNavigate={closePanel}
                    onToggle={() => togglePinned("pages")}
                    onTriggerKey={(event) => triggerKey(event, "pages")}
                    buttonRef={(element) => {
                      triggerButtons.current["pages"] = element;
                    }}
                  />
                </div>
              </>
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

            <AnimatePresence>{megaPanel}</AnimatePresence>
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
              {isStaff && (
                <div className="mt-3 first:mt-0">
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Staff tools
                  </p>
                  <div className="grid gap-0.5">
                    {staffLinks.map((item) => {
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
                            "pressable flex min-h-11 items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                            active && "bg-accent/10 font-semibold text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              active && "underline decoration-accent decoration-2 underline-offset-4"
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
              )}

              {PUBLIC_NAV_GROUPS.map((group) => (
                <div key={group.id} className="mt-3 first:mt-0">
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {isStaff ? `Browse: ${group.label}` : group.label}
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
                            "pressable flex min-h-11 items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                            active && "bg-accent/10 font-semibold text-foreground"
                          )}
                        >
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "block",
                                active &&
                                  "underline decoration-accent decoration-2 underline-offset-4"
                              )}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                                {item.description}
                              </span>
                            )}
                          </span>
                          {active && (
                            <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-accent">
                              Current
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
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
    </MotionConfig>
  );
}
