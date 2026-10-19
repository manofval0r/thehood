"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";

/**
 * GitHub-style repository navigation.
 *
 * At rest it is a plain full-width bar with underlined tabs. Once the page
 * scrolls, the bar contracts into a floating pill with a soft backdrop and a
 * lift shadow, so it stops competing with the content it floats above.
 *
 * Scroll state comes from an IntersectionObserver watching a sentinel at the
 * top of the document, not a scroll listener: the threshold is the only thing
 * that matters, and the observer costs nothing between changes.
 */

const TABS = [
  { href: "/", label: "Courses" },
  { href: "/timetable", label: "Timetable" },
  { href: "/timeline", label: "Calendar" },
  { href: "/registration", label: "Registration" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [underline, setUnderline] = useState({ left: 0, width: 0, ready: false });
  const tabListRef = useRef<HTMLDivElement>(null);

  const activeHref = TABS.find((t) =>
    t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)
  )?.href;

  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-href="${activeHref}"]`);
    if (!el) return;
    setUnderline({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeHref]);

  // One boolean across a 24px threshold. No rAF wrapper: requestAnimationFrame
  // is throttled to zero in background and headless contexts, which would pin
  // the nav in its expanded state. React bails out of the render when the
  // value is unchanged, so calling this directly on every scroll event is
  // cheap and stays correct without the frame dependency.
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
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

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Inset only while floating, so the pill can breathe off the edges. */}
        <div className={cn("transition-[padding] duration-300 ease-out", scrolled && "px-3 pt-3")}>
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-300 ease-out",
              scrolled
                ? "h-14 rounded-full border border-border bg-surface/80 px-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                : "h-16 border-b border-border bg-surface px-4 sm:px-6 lg:px-8"
            )}
          >
            <Link
              href="/"
              className="pressable rounded-md"
              aria-label="Cyber-Security 300L home"
            >
              <Wordmark size="md" />
            </Link>

            {/* ---------- Tabs ---------- */}
            <div ref={tabListRef} className="relative hidden h-full items-stretch md:flex">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-0 h-0.5 rounded-full bg-accent transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  underline.ready ? "opacity-100" : "opacity-0"
                )}
                style={{
                  transform: `translateX(${underline.left}px)`,
                  width: underline.width,
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
                      "pressable relative flex items-center px-3.5 text-[14px] font-medium transition-colors",
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

            <button
              onClick={() => setOpen((v) => !v)}
              className="pressable -mr-2 flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-surface-hover md:hidden"
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
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-0 border-b border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <Wordmark size="md" />
              <button
                onClick={() => setOpen(false)}
                className="pressable -mr-1 flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-surface-hover"
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
                        "pressable flex items-center rounded-md px-3 py-3 text-[15px] font-medium transition-colors",
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
          </div>
        </div>
      )}
    </>
  );
}
