"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, ChevronDown, Download, Inbox, Mail } from "lucide-react";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  downloadIcs,
  icsFilename,
  type CalendarEvent,
} from "@/lib/calendar-links";
import { cn } from "@/lib/utils";

/**
 * One tap onto the reader's own calendar.
 *
 * The site never holds anyone's calendar account, so the buttons open the
 * reader's calendar app prefilled (Google, Outlook) or download a native
 * event file. The label says what it does; the menu says where to.
 */
export default function AddToCalendar({
  event,
  uid,
  className,
}: {
  event: CalendarEvent;
  uid?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const details = event.details;
  const location = event.location;
  const title = event.title;

  const save = (kind: "google" | "outlook" | "ics") => {
    const payload = { title, dueAt: event.dueAt, details, location };
    if (kind === "google") {
      window.open(googleCalendarUrl(payload), "_blank", "noopener,noreferrer");
    } else if (kind === "outlook") {
      window.open(outlookCalendarUrl(payload), "_blank", "noopener,noreferrer");
    } else {
      downloadIcs(payload, icsFilename(title), uid ?? title);
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent max-sm:min-h-11"
      >
        <CalendarPlus size={15} aria-hidden="true" />
        <span className="max-sm:hidden">Add to calendar</span>
        <ChevronDown size={13} aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Add to calendar"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-border-strong bg-surface-raised p-1 shadow-lift"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => save("google")}
            className="pressable flex w-full min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-surface-hover"
          >
            <Mail size={14} aria-hidden="true" className="text-accent" />
            Google Calendar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => save("outlook")}
            className="pressable flex w-full min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-surface-hover"
          >
            <Inbox size={14} aria-hidden="true" className="text-accent" />
            Outlook Calendar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => save("ics")}
            className="pressable flex w-full min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-surface-hover"
          >
            <Download size={14} aria-hidden="true" className="text-accent" />
            Download .ics (any calendar)
          </button>
        </div>
      )}
    </div>
  );
}
