"use client";

import * as React from "react";
import { CalendarPlus, Download, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The calendar and wallpaper downloads, as pills rather than cards.
 *
 * Two cards at equal weight said "these are two more things this site does",
 * which is not the point. They are two small conveniences, so they sit inline
 * as pills that explain themselves on hover.
 *
 * The wallpaper pill opens to device glyphs instead of pixel dimensions.
 * "1920 x 1080" is a number the reader has to interpret; a laptop outline is
 * something they already understand. The dimensions stay as the label under
 * each glyph for anyone who does want them.
 *
 * The wallpaper is the timetable, not the hooded figure. What a student pins
 * to a laptop for a whole semester is the thing they will look at every day,
 * which is when and where they are meant to be. The artwork already has the
 * favicon and the 404; it does not need a third job.
 */

const WALLPAPERS = [
  { icon: Monitor, label: "Desktop", size: "1920 x 1080", href: "/timetable-wallpaper-1920x1080.png" },
  { icon: Monitor, label: "Large", size: "2560 x 1440", href: "/timetable-wallpaper-2560x1440.png" },
  { icon: Tablet, label: "Tablet", size: "portrait", href: "/timetable-wallpaper-1170x2532.png" },
  { icon: Smartphone, label: "Phone", size: "1170 x 2532", href: "/timetable-wallpaper-1170x2532.png" },
];

export default function TakeawayPills() {
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-start gap-3">
      {/* ---------- Calendar ---------- */}
      <div
        className="relative"
        onMouseEnter={() => setOpen("ics")}
        onMouseLeave={() => setOpen(null)}
        onFocus={() => setOpen("ics")}
        onBlur={() => setOpen(null)}
      >
        <a
          href="/calendar.ics"
          download
          className="pressable inline-flex items-center gap-2.5 rounded-full border border-border py-2 pl-3 pr-4 text-[13px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
        >
          <CalendarPlus size={15} className="text-accent" />
          Add to calendar
        </a>

        <div
          className={cn(
            "pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-64 origin-bottom-left rounded-lg border border-border-strong bg-surface-raised p-3.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.95)]",
            "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            open === "ics"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          <p className="text-[13px] leading-relaxed text-foreground">
            Import the whole session into your own calendar.
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Works with Google Calendar, Apple Calendar and Outlook. Every dated
            milestone the Registrar published, generated from the same source as
            the page above.
          </p>
        </div>
      </div>

      {/* ---------- Wallpapers ---------- */}
      <div
        className="relative"
        onMouseEnter={() => setOpen("wall")}
        onMouseLeave={() => setOpen(null)}
        onFocus={() => setOpen("wall")}
        onBlur={() => setOpen(null)}
      >
        <button
          type="button"
          className="pressable inline-flex items-center gap-2.5 rounded-full border border-border py-2 pl-3 pr-4 text-[13px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
          aria-expanded={open === "wall"}
        >
          <Download size={15} className="text-accent" />
          Add as wallpaper
        </button>

        <div
          className={cn(
            "absolute bottom-full left-0 z-30 mb-2 rounded-lg border border-border-strong bg-surface-raised p-3.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.95)]",
            "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            open === "wall"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          <p className="text-[13px] leading-relaxed text-foreground">
            Your week, as a wall.
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            The whole timetable drawn in pixel type, with today marked and the
            class that is running picked out. Generated from the same schedule
            the page is showing, so it cannot go out of date.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {WALLPAPERS.map((w) => (
              <li key={w.label + w.size}>
                <a
                  href={w.href}
                  download
                  className="pressable group flex flex-col items-center gap-1.5 rounded-md border border-transparent px-2 py-2.5 text-center transition-colors hover:border-border hover:bg-surface-hover"
                >
                  <w.icon
                    size={26}
                    className="text-muted transition-colors group-hover:text-accent"
                  />
                  <span className="text-[12px] font-medium text-foreground">
                    {w.label}
                  </span>
                  <span className="tnum text-[10.5px] text-muted-foreground">
                    {w.size}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
