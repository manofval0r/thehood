"use client";

import * as React from "react";
import { X, Clock, Calendar, Bell, Plus } from "lucide-react";
import {
  defaultReminders,
  type AssessmentType,
  typeLabel,
  typeColour,
} from "@/lib/assessments";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: AssessmentType[] = ["exam", "test", "assignment"];

interface AssessmentFormProps {
  /** When editing, the existing assessment. */
  assessment?: {
    id: string;
    course_code: string;
    title: string;
    type: AssessmentType;
    dueAt: string;
  };
  /** The courses to choose from. */
  courses: { code: string; title: string }[];
  onSubmit: (data: {
    courseCode: string;
    title: string;
    type: AssessmentType;
    dueAt: string;
    reminders: { offset_hours: number; channel: string }[];
  }) => void;
  onClose: () => void;
  busy?: boolean;
}

export function AssessmentForm({
  assessment,
  courses,
  onSubmit,
  onClose,
  busy = false,
}: AssessmentFormProps) {
  const [open, setOpen] = React.useState(true);
  const [courseCode, setCourseCode] = React.useState(
    assessment?.course_code ?? courses[0]?.code ?? ""
  );
  const [title, setTitle] = React.useState(assessment?.title ?? "");
  const [type, setType] = React.useState<AssessmentType>(
    assessment?.type ?? "assignment"
  );
  const [dueAt, setDueAt] = React.useState(assessment?.dueAt ?? "");
  const [reminders, setReminders] = React.useState<{
    offset_hours: number;
    channel: string;
  }[]>(
    assessment
      ? [
          {
            offset_hours: 168,
            channel: "browser",
          },
          {
            offset_hours: 24,
            channel: "browser",
          },
          {
            offset_hours: 1,
            channel: "browser",
          },
        ]
      : defaultReminders().map((r) => ({ offset_hours: r.offset_hours, channel: "browser" as const }))
  );

  React.useEffect(() => {
    setOpen(true);
    // Trap focus: return focus to the document when closed.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentCourse = courses.find((c) => c.code === courseCode);

  const valid =
    Boolean(courseCode) &&
    Boolean(title.trim()) &&
    Boolean(dueAt) &&
    new Date(dueAt).getTime() > Date.now();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      courseCode,
      title: title.trim(),
      type,
      dueAt,
      reminders,
    });
  };

  const toggleReminder = (index: number) => {
    setReminders((prev) => {
      const next = [...prev];
      next[index].channel = next[index].channel === "browser" ? "off" : "browser";
      return next;
    });
  };

  const removeReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const addReminder = () => {
    setReminders((prev) => [...prev, { offset_hours: 1, channel: "browser" as const }]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop. */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative w-full max-w-lg mx-4 rounded-lg border border-border-strong bg-surface-raised shadow-lift p-6",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={assessment ? "Edit assessment" : "New assessment"}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            {assessment ? "Edit assessment" : "New assessment"}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="pressable shrink-0 grid h-10 w-10 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Course
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              disabled={busy}
              className="w-full rounded-md border border-border bg-surface py-2 pl-3 pr-9 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
            {currentCourse && (
              <p className="mt-1 text-[11px] text-muted">{currentCourse.title}</p>
            )}
          </div>

          {/* Title. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder="e.g. CYB 305 Midterm"
              className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
            />
          </div>

          {/* Type. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const colour = typeColour(t);
                const active = type === t;
                const icon =
                  t === "exam" ? <Clock size={14} /> : t === "test" ? <Calendar size={14} /> : <Bell size={14} />;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={cn(
                      "pressable flex flex-col items-center gap-1 rounded-md border py-2 px-2 text-[11px] font-medium transition-colors max-sm:min-h-11",
                      active
                        ? cn(colour, "border-accent/50")
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded flex items-center justify-center",
                        active ? "bg-accent text-accent-foreground" : "bg-surface-hover text-muted-foreground"
                      )}
                    >
                      {icon}
                    </span>
                    <span>{typeLabel(t)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date/time. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Due date & time
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              disabled={busy}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
            />
          </div>

          {/* Reminders. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Reminders
              </label>
              <button
                type="button"
                onClick={addReminder}
                disabled={busy}
                className="pressable inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-accent transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                <Plus size={12} aria-hidden="true" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {reminders.map((r, index) => {
                const labels: Record<number, string> = {
                  168: "1 week before",
                  24: "1 day before",
                  1: "1 hour before",
                };
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface p-2"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 text-[12px] text-foreground">
                      <input
                        type="checkbox"
                        checked={r.channel === "browser"}
                        onChange={() => toggleReminder(index)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                      />
                      <span>{labels[r.offset_hours] ?? `${r.offset_hours} hours before`}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeReminder(index)}
                      disabled={busy || reminders.length === 1}
                      aria-label="Remove reminder"
                      className={cn(
                        "pressable shrink-0 grid h-8 w-8 place-items-center rounded text-muted transition-colors hover:bg-surface-hover disabled:opacity-30",
                        reminders.length === 1 ? "opacity-50 pointer-events-none" : ""
                      )}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted">
            Reminders fire as browser notifications when you have the site
            open. Choose which intervals matter for this assessment.
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="pressable flex-1 rounded-md border border-border bg-surface py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover disabled:opacity-50 max-sm:min-h-11"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || busy}
              className={cn(
                "pressable flex-1 rounded-md bg-accent px-2.5 py-2.5 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none max-sm:min-h-11",
                !valid ? "border border-border/50" : ""
              )}
            >
              {busy ? <Plus size={14} className="animate-spin" /> : <Plus size={14} />}
              {assessment ? "Save changes" : "Add assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
