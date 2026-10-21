"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Light / dark switch, in the bar.
 *
 * It used to float below the header, and it looked good there. It was also
 * sitting on top of the right hand edge of every page: the pages put links
 * in their top right corners, and a reader reaching for one of them was
 * reaching for the switch. At a narrow width the switch was covering the
 * rightmost sixty pixels of the content, which is a fifth of a phone.
 *
 * The bar is the only place a control can be that is never in the way. It
 * is always exactly where it was, it never covers anything, and a reader
 * does not have to scroll to find it.
 *
 * The icon shows the mode the button will switch to, and the label says so
 * as well, so it cannot be wrong about what it does.
 */
export default function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggle, ready } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className={cn(
        "pressable relative grid h-8 w-8 shrink-0 place-items-center rounded-md",
        "border border-border bg-surface text-muted-foreground transition-colors",
        "hover:border-border-strong hover:bg-surface-hover hover:text-foreground",
        className
      )}
    >
      <span aria-hidden="true" className="grid place-items-center">
        {light ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
      </span>
      {/* Screen readers get a state, not just a button. */}
      <span className="sr-only" aria-live="polite">
        {ready ? `${light ? "Light" : "Dark"} mode` : ""}
      </span>
    </button>
  );
}
