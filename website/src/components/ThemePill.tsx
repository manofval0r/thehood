"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Light / dark switch, floating below the header.
 *
 * It lives outside the navbar because the navbar was carrying six things and
 * the countdown needed the room. Sitting on its own below the bar also means
 * it never shifts the header's geometry, which is what kept the collapsed bar
 * from juddering as it scrolled.
 *
 * Scroll behaviour, and why it is only transform and opacity:
 *
 *   - Under the threshold it rests. This is the top of the page, where the
 *     header is full width and there is nothing to compete with.
 *   - Past the threshold it becomes a real control: a solid surface, a
 *     border, and a lift. A translucent pill floating over page content is
 *     invisible against a white section and dominant over a dark one.
 *   - Scrolling back up returns it to rest. The switch is a control, not a
 *     notification, so it must not have a life cycle the reader has to learn.
 *
 * Every property that changes here is compositor-only, so a scroll storm moves
 * it without touching layout.
 */
export default function ThemePill({ className }: { className?: string }) {
  const { theme, toggle, ready } = useTheme();
  const [lifted, setLifted] = React.useState(false);
  const light = theme === "light";

  React.useEffect(() => {
    // Passive: this reads scroll position on every frame and must never be
    // the reason the page waits on the main thread.
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40",
        // Clear of the header, and inside the page gutter on wide screens.
        "top-[calc(var(--nav-h,4rem)+0.75rem)] right-4 sm:right-6 lg:right-8",
        className
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${light ? "dark" : "light"} mode`}
        title={`Switch to ${light ? "dark" : "light"} mode`}
        className={cn(
          "pressable pointer-events-auto relative inline-flex h-9 items-center rounded-full p-1",
          "transition-[background-color,border-color,box-shadow,transform] duration-[420ms]",
          "ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          lifted
            ? "border border-border-strong bg-surface shadow-lift"
            : "border border-transparent bg-transparent",
          // A hair of lift once it is over page content, so it separates from
          // whatever section happens to be behind it.
          lifted && "lg:scale-[1.02]",
          "hover:border-border-strong",
          light ? "hover:bg-surface-hover" : "hover:bg-surface-hover"
        )}
      >
        {/* The thumb slides between the two ends. Transform only. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-1 top-1 h-7 w-7 rounded-full",
            "bg-accent/14 ring-1 ring-inset ring-accent/30",
            "transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
            light ? "translate-x-8" : "translate-x-0"
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
            light ? "text-muted-foreground" : "text-accent"
          )}
        >
          <Moon size={14} strokeWidth={2} />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
            light ? "text-accent" : "text-muted-foreground"
          )}
        >
          <Sun size={14} strokeWidth={2} />
        </span>
        <span className="sr-only" aria-live="polite">
          {ready ? `${light ? "Light" : "Dark"} mode` : ""}
        </span>
      </button>
    </div>
  );
}