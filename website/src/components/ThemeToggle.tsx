"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Light / dark switch.
 *
 * A segmented pill rather than a single icon button. A one-way toggle has to
 * be labelled with the thing it will switch TO, which is a label; two states
 * both visible answers that without any text at all, and it cannot be wrong
 * about which mode you are in.
 *
 * The thumb slides on transform only, so switching themes never triggers
 * layout on the whole page.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle, ready } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className={cn(
        "pressable relative inline-flex h-8 shrink-0 items-center rounded-lg border border-border bg-surface p-0.5",
        "transition-colors hover:border-border-strong hover:bg-surface-hover",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0.5 top-0.5 h-7 w-7 rounded-md bg-accent/14 ring-1 ring-inset ring-accent/30",
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          light ? "translate-x-7" : "translate-x-0"
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200",
          light ? "text-muted-foreground" : "text-accent"
        )}
      >
        <Moon size={14} strokeWidth={2} />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200",
          light ? "text-accent" : "text-muted-foreground"
        )}
      >
        <Sun size={14} strokeWidth={2} />
      </span>
      {/* Screen readers get a state, not just a button. */}
      <span className="sr-only" aria-live="polite">
        {ready ? `${light ? "Light" : "Dark"} mode` : ""}
      </span>
    </button>
  );
}