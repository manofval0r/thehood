"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GitBranch, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";

/**
 * Navigation shaped like a git branch switcher.
 *
 * "Courses" is the default branch. The other destinations hang off it as
 * named branches, and the checked-out one is filled, with a stem dropping
 * to the baseline. The active pill is measured and moved with a transform,
 * so switching pages slides it rather than snapping it.
 */
const BRANCHES = [
  { href: "/", label: "Courses", ref: "main" },
  { href: "/timetable", label: "Timetable", ref: "weekly" },
  { href: "/timeline", label: "Calendar", ref: "session" },
  { href: "/registration", label: "Registration", ref: "enrolment" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const listRef = useRef<HTMLDivElement>(null);

  const activeHref = BRANCHES.find((b) =>
    b.href === "/" ? pathname === "/" : pathname.startsWith(b.href)
  )?.href;

  // Move the pill to whatever is checked out.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-href="${activeHref}"]`);
    if (!el) return;
    setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeHref]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border">
        <div className="sticky-head">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="pressable rounded-md" aria-label="Cyber-Security 300L home">
              <Wordmark size="md" />
            </Link>

            {/* ---------- Branch switcher ---------- */}
            <div ref={listRef} className="relative hidden md:block">
              {/* Sliding indicator */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 -z-0 rounded-md bg-accent/12 ring-1 ring-accent/30 transition-[transform,width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  pill.ready ? "opacity-100" : "opacity-0"
                )}
                style={{
                  transform: `translateX(${pill.left}px)`,
                  width: pill.width,
                }}
              />

              <ul className="relative flex items-center">
                {BRANCHES.map((b) => {
                  const active = b.href === activeHref;
                  return (
                    <li key={b.href}>
                      <Link
                        data-href={b.href}
                        href={b.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "pressable relative flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {/* Branch glyph. main is solid, branches are hollow. */}
                        <GitBranch
                          size={13}
                          strokeWidth={2.2}
                          className={cn(
                            "transition-colors",
                            active ? "text-accent" : "text-muted"
                          )}
                        />
                        <span>{b.label}</span>
                        {/* The ref name, the way git shows it. */}
                        <span
                          className={cn(
                            "font-mono text-[10px] transition-colors",
                            active
                              ? "text-accent/80"
                              : "text-muted/70 group-hover:text-muted"
                          )}
                        >
                          {b.ref}
                        </span>
                        {/* Stem down to the baseline for the checked-out branch. */}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-[9px] left-1/2 h-2 w-px -translate-x-1/2 bg-accent"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="pressable -mr-1 flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-surface-hover md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
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
              {BRANCHES.map((b, i) => {
                const active = b.href === activeHref;
                return (
                  <li key={b.href} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
                    <Link
                      href={b.href}
                      className={cn(
                        "pressable flex items-center gap-2.5 rounded-md px-3 py-3 text-[15px] font-medium transition-colors",
                        active
                          ? "bg-accent/12 text-foreground"
                          : "text-foreground hover:bg-surface-hover"
                      )}
                    >
                      <GitBranch
                        size={16}
                        className={active ? "text-accent" : "text-muted"}
                      />
                      {b.label}
                      <span className="ml-auto font-mono text-[10px] text-muted">
                        {b.ref}
                      </span>
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