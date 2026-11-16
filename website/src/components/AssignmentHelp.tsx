"use client";

import * as React from "react";
import Link from "next/link";
import { X, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The assignments help sheet.
 *
 * A real guide, not a docs wall: how to set an assignment this year class
 * will actually understand, which reminder cadence to pick, why you cannot
 * edit yours after clearing browser data, and the two things staff can
 * always do that you cannot.
 */
export default function AssignmentHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close help"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-help-title"
        className="relative max-h-[86dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl border border-border-strong bg-surface-raised p-6 shadow-lift sm:rounded-2xl sm:p-7"
      >
        <div className="sticky top-0 -mx-6 -mt-6 mb-5 flex items-start justify-between gap-4 border-b border-border bg-surface-raised/95 px-6 pb-4 pt-5 backdrop-blur-sm sm:-mx-7 sm:px-7">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-accent">
              Help · Assignments
            </p>
            <h2
              id="assignment-help-title"
              className="mt-1.5 text-[20px] font-semibold tracking-tight text-foreground"
            >
              Set an assignment that works
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-7 text-[13px] leading-relaxed text-muted-foreground">
          <Section title="The six decisions that make an assignment">
            <ol className="space-y-2.5">
              {[
                "Course: the class it appears under. One assignment, one course; pick from the list.",
                "Title: what the student sees first. Keep it concrete: “CYB 305 Evidence integrity write-up”, not “Week 4 work”.",
                "Group or individual: one grade for a set, or everyone submits separately.",
                "Due date and time (Africa/Lagos). Students see a live countdown everywhere it appears.",
                "How to submit: email opens their mail client with the address prefilled; presentation is in class; in person is a physical hand-in; other is anything you describe.",
                "Reminders: pick how often you want it nagged about, plus which specific milestones.",
              ].map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 font-mono text-[9px] font-semibold text-accent">
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Resources worth linking">
            <ul className="space-y-1.5">
              <li>
                <strong className="text-foreground">YouTube</strong>: link to
                the video itself, not the channel. The card shows the thumbnail,
                title and channel; students tap and watch without searching.
              </li>
              <li>
                <strong className="text-foreground">Files</strong>: any direct
                link: the course files on this site, the department shared
                drive, a PDF in the public folder. Uploads themselves happen
                in the staff area (Resources → Upload); here you link to them.
              </li>
              <li>Maximum eight resources. They appear on the card, on the course page and on the shared link.</li>
            </ul>
          </Section>

          <Section title="Reminder cheat sheet">
            <p>
              Two independent controls: how <em>often</em> to remind before the
              deadline, and <em>which</em> milestones to remind at.
            </p>
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-3 py-2 text-left">Frequency</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Fires</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Once", "A single push at your first milestone"],
                    ["Every day", "Daily, through to the deadline"],
                    ["Every week", "Weekly to the deadline"],
                    ["Every 2 weeks", "Every fortnight; the default"],
                    ["Every month", "Monthly, for long-term assignments"],
                    ["Custom", "Your N hours before the deadline"],
                  ].map(([a, b]) => (
                    <tr key={a} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground">{a}</td>
                      <td className="px-3 py-2">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              Milestones run 1 hour, 12 hours, 1 day, 3 days and 1 week before
              the deadline. Reminders stop once someone marks the assignment
              done.
            </p>
          </Section>

          <Section title="The one-tap calendar shortcut">
            <p>
              Every assignment card, and this page, has{" "}
              <strong className="text-foreground">Add to calendar</strong>. One
              tap puts the due date on your own phone calendar: Google
              Calendar, Outlook, or a generic .ics file for anything else. It
              carries the title, course, due date and your notes.
            </p>
          </Section>

          <Section title="Who can change what">
            <ul className="space-y-1.5">
              <li>
                <strong className="text-foreground">Anyone</strong> can set an
                assignment. No sign-in. The card it creates is public the
                moment you save.
              </li>
              <li>
                <strong className="text-foreground">This browser</strong> can
                edit and delete the ones it created; the form remembers them
                here. Clear your browser data and that right is gone (staff
                can still help).
              </li>
              <li>
                <strong className="text-foreground">Staff</strong> can edit,
                delete or mark done anything on this page. If you set
                something wrong for a hundred people, tell the course rep
                instead of shouting.
              </li>
            </ul>
          </Section>

          <Section title="After you post it">
            <ul className="space-y-1.5">
              <li>It appears here, on the course page, and in the calendar of anyone subscribed to the timetable feed.</li>
              <li>Students get the reminders you chose. No separate setup.</li>
              <li>The share icon copies a link into the class group chat.</li>
              <li>
                <strong className="text-foreground">Done</strong> = submissions
                are in; reminders stop for everyone. Mark it only if you mean
                it.
              </li>
            </ul>
          </Section>

          <Section title="For staff">
            <p>
              Same power plus two: <strong className="text-foreground">generate a share token</strong>
              {" "}for the public link, and <strong className="text-foreground">moderate</strong>{" "}
              anything a student set. Edit, delete, mark done. Use it before
              the whole cohort gets spammed.
            </p>
          </Section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            <Link
              href="/assignments/new"
              onClick={onClose}
              className="pressable inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Set an assignment
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/"
              onClick={onClose}
              className="pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              Browse the courses
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function AssignmentHelpButton({
  onOpen,
  className,
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Assignment help"
      className={cn(
        "pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent",
        className
      )}
    >
      <HelpCircle size={16} aria-hidden="true" />
      <span className="max-sm:hidden">Help</span>
    </button>
  );
}
