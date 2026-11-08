"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  Clock,
  Mail,
  Presentation,
  MapPin,
  Link,
  Play,
  Upload,
  Plus,
  Trash2,
  Users,
  Share2,
  Copy,
} from "lucide-react";
import {
  type AssignmentType,
  type SubmitMethod,
  type NotificationFrequency,
  type AssignmentResource,
  typeColour,
  submitMethodLabel,
  notificationFrequencyLabel,
} from "@/lib/assignments";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: AssignmentType[] = ["group", "individual"];
const SUBMIT_METHOD_OPTIONS: SubmitMethod[] = [
  "email",
  "presentation",
  "inperson",
  "other",
];
const FREQUENCY_OPTIONS: NotificationFrequency[] = [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
];

const FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  once: "Once",
  daily: "Every day",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
  custom: "Custom",
};

const FREQUENCY_HOURS: Record<NotificationFrequency, number> = {
  once: 0,
  daily: 24,
  weekly: 168,
  biweekly: 336,
  monthly: 720,
  custom: 0,
};

interface AssignmentFormProps {
  /**
   * Render as a plain in-flow section instead of a full-screen modal. The
   * page owns the chrome (back link, heading) in this mode.
   */
  bare?: boolean;
  assessment?: {
    id: string;
    course_code: string;
    course_title: string;
    title: string;
    type: AssignmentType;
    due_at: string;
    submit_method: SubmitMethod;
    submit_detail: string;
    notes: string;
    event_title: string;
    event_at: string | null;
    notification_frequency: NotificationFrequency;
    custom_reminder_hours: number | null;
    resources: AssignmentResource[];
    reminders: { offset_hours: number }[];
    share_token: string | null;
  };
  courses: { code: string; title: string }[];
  onSubmit: (data: {
    courseCode: string;
    courseTitle: string;
    title: string;
    type: AssignmentType;
    dueAt: string;
    submitMethod: SubmitMethod;
    submitDetail: string;
    notes: string;
    eventTitle: string;
    eventAt: string | null;
    notificationFrequency: NotificationFrequency;
    customReminderHours: number | null;
    resources: { type: "youtube" | "upload"; url: string; title: string }[];
    reminders: { offset_hours: number }[];
  }) => void;
  onClose: () => void;
  busy?: boolean;
}

export function AssignmentForm({
  bare = false,
  assessment,
  courses,
  onSubmit,
  onClose,
  busy = false,
}: AssignmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(true);
  const [courseCode, setCourseCode] = React.useState(
    assessment?.course_code ?? courses[0]?.code ?? ""
  );
  const [courseTitle, setCourseTitle] = React.useState(
    assessment?.course_title ?? ""
  );
  const [title, setTitle] = React.useState(assessment?.title ?? "");
  const [type, setType] = React.useState<AssignmentType>(
    assessment?.type ?? "individual"
  );
  const [dueAt, setDueAt] = React.useState(assessment?.due_at ?? "");
  const [submitMethod, setSubmitMethod] = React.useState<SubmitMethod>(
    assessment?.submit_method ?? "other"
  );
  const [submitDetail, setSubmitDetail] = React.useState(
    assessment?.submit_detail ?? ""
  );
  const [notes, setNotes] = React.useState(assessment?.notes ?? "");
  const [eventTitle, setEventTitle] = React.useState(
    assessment?.event_title ?? ""
  );
  const [eventAt, setEventAt] = React.useState(assessment?.event_at ?? "");
  const [notificationFrequency, setNotificationFrequency] = React.useState<NotificationFrequency>(
    assessment?.notification_frequency ?? "once"
  );
  const [customReminderHours, setCustomReminderHours] = React.useState<number | null>(
    assessment?.custom_reminder_hours ?? null
  );
  const [resources, setResources] = React.useState<AssignmentResource[]>(
    assessment?.resources ?? []
  );
  const [reminders, setReminders] = React.useState<{ offset_hours: number }[]>(
    assessment
      ? assessment.reminders?.map((r) => ({ offset_hours: r.offset_hours })) ??
        []
      : [{ offset_hours: 168 }]
  );
  const [shareUrl, setShareUrl] = React.useState<string | null>(
    assessment?.share_token
      ? `${window.location.origin}/assignments/${assessment.id}?share=${assessment.share_token}`
      : null
  );

  React.useEffect(() => {
    setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentCourse = courses.find((c) => c.code === courseCode);

  const isEmailMethod = submitMethod === "email";
  const isCustomFrequency = notificationFrequency === "custom";

  const valid =
    Boolean(courseCode) &&
    Boolean(title.trim()) &&
    Boolean(dueAt) &&
    new Date(dueAt).getTime() > Date.now() &&
    (!isEmailMethod ||
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitDetail.trim()) &&
        Boolean(submitDetail.trim()))) &&
    (!isCustomFrequency || Boolean(customReminderHours));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      courseCode,
      courseTitle: courseTitle || currentCourse?.title || "",
      title: title.trim(),
      type,
      dueAt,
      submitMethod,
      submitDetail,
      notes,
      eventTitle,
      eventAt: eventAt || null,
      notificationFrequency,
      customReminderHours,
      resources,
      reminders,
    });
  };

  const addResource = () => {
    setResources([
      ...resources,
      { id: crypto.randomUUID(), type: "youtube", url: "", title: "" },
    ]);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
  };

  const updateResource = (
    id: string,
    field: keyof Omit<AssignmentResource, "id" | "assignment_id">,
    value: string
  ) => {
    setResources(
      resources.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const toggleReminder = (index: number) => {
    setReminders((prev) => {
      const next = [...prev];
      next[index].offset_hours =
        next[index].offset_hours === 168 ? 24 : 168;
      return next;
    });
  };

  const removeReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  const addReminder = () => {
    setReminders((prev) => [...prev, { offset_hours: 24 }]);
  };

  const copyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div
      className={cn(
        bare
          ? "w-full"
          : "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      )}
      onClick={
        bare
          ? undefined
          : (e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }
      }
    >
      {/* Backdrop. */}
      {!bare && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          bare
            ? "w-full rounded-2xl border border-border-strong bg-surface-raised p-5 sm:p-7"
            : "relative m-4 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-border-strong bg-surface-raised p-5 shadow-lift sm:p-6",
          !bare && (open ? "scale-100 opacity-100" : "scale-95 opacity-0")
        )}
        role={bare ? undefined : "dialog"}
        aria-modal={bare ? undefined : true}
        aria-label={assessment ? "Edit assignment" : "New assignment"}
      >
        {bare ? (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-accent">
                Form A-19 · {assessment ? "Amendment" : "New assignment"}
              </p>
              <h2 className="mt-1.5 text-[19px] font-semibold tracking-tight text-foreground">
                {assessment ? "Amend the assignment" : "Set an assignment"}
              </h2>
            </div>
            <p className="hidden font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted sm:block">
              Filed under the course
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {assessment ? "Edit assignment" : "New assignment"}
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
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Course
            </label>
            <select
              value={courseCode}
              onChange={(e) => {
                setCourseCode(e.target.value);
                const c = courses.find((cc) => cc.code === e.target.value);
                setCourseTitle(c?.title ?? "");
              }}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Assignment type
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const active = type === t;
                const icon = t === "group" ? <Users size={14} /> : <Clock size={14} />;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className={cn(
                      "pressable flex flex-col items-center gap-1 rounded-md border py-2 px-2 text-[11px] font-medium transition-colors max-sm:min-h-11",
                      active
                        ? cn(typeColour(t), "border-accent/50")
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-8 w-8 rounded flex items-center justify-center", active ? "bg-accent text-accent-foreground" : "bg-surface-hover text-muted-foreground")}>
                      {icon}
                    </span>
                    <span>{type === t ? "Group work" : "Individual"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit method. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              How to submit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUBMIT_METHOD_OPTIONS.map((m) => {
                const active = submitMethod === m;
                const icon =
                  m === "email" ? <Mail size={14} /> : m === "presentation" ? <Presentation size={14} /> : m === "inperson" ? <MapPin size={14} /> : <Link size={14} />;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSubmitMethod(m)}
                    aria-pressed={active}
                    className={cn(
                      "pressable flex flex-col items-center gap-1 rounded-md border py-2 px-2 text-[11px] font-medium transition-colors max-sm:min-h-11",
                      active
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    <span className="h-8 w-8 rounded flex items-center justify-center bg-surface text-muted-foreground">
                      {icon}
                    </span>
                    <span>{submitMethodLabel(m)}</span>
                  </button>
                );
              })}
            </div>
            {isEmailMethod && (
              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={submitDetail}
                  onChange={(e) => setSubmitDetail(e.target.value)}
                  disabled={busy}
                  placeholder="student@example.com"
                  className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
                />
              </div>
            )}
            {(submitMethod === "presentation" || submitMethod === "inperson") && (
              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={submitDetail}
                  onChange={(e) => setSubmitDetail(e.target.value)}
                  disabled={busy}
                  placeholder={submitMethod === "presentation" ? "e.g. Bring slides on USB" : "e.g. Hand in at office"}
                  className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
                />
              </div>
            )}
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

          {/* Event (optional). */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              In-class event (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                disabled={busy}
                placeholder="e.g. Group presentations"
                className="rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
              />
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                disabled={busy}
                className="rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Optional class event, e.g. a volunteer going over the
              assignment in class.
            </p>
          </div>

          {/* Notification frequency. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Reminder frequency
            </label>
            <div className="flex gap-2">
              {FREQUENCY_OPTIONS.map((f) => {
                const active = notificationFrequency === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setNotificationFrequency(f)}
                    aria-pressed={active}
                    className={cn(
                      "pressable flex-1 rounded-md border py-2 px-2 text-[11px] font-medium transition-colors max-sm:min-h-11",
                      active
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    {notificationFrequencyLabel(f)}
                  </button>
                );
              })}
            </div>
            {isCustomFrequency && (
              <div className="mt-3">
                <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
                  Custom reminder (hours before deadline)
                </label>
                <input
                  type="number"
                  value={customReminderHours ?? ""}
                  onChange={(e) => setCustomReminderHours(Number(e.target.value))}
                  disabled={busy}
                  min="1"
                  placeholder="e.g. 48"
                  className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Remind this many hours before the deadline.
                </p>
              </div>
            )}
          </div>

          {/* Notes. */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Any extra notes about this assignment..."
              className="w-full rounded-md border border-border bg-surface py-2 pl-3 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
            />
          </div>

          {/* Resources. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Resources (YouTube or uploads)
              </label>
              <button
                type="button"
                onClick={addResource}
                disabled={busy}
                className="pressable inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] text-accent transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                <Plus size={12} aria-hidden="true" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-md border border-border bg-surface p-2">
                  <select
                    value={r.type}
                    onChange={(e) => updateResource(r.id, "type", e.target.value as "youtube" | "upload")}
                    className="text-[11px] bg-transparent border-none focus:ring-0"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="upload">File upload</option>
                  </select>
                  <input
                    type="url"
                    value={r.url}
                    onChange={(e) => updateResource(r.id, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-[12px] text-foreground bg-transparent border-none focus:ring-0"
                  />
                  <input
                    type="text"
                    value={r.title}
                    onChange={(e) => updateResource(r.id, "title", e.target.value)}
                    placeholder="Title"
                    className="text-[12px] text-foreground bg-transparent border-none focus:ring-0 w-24"
                  />
                  <button
                    type="button"
                    onClick={() => removeResource(r.id)}
                    aria-label="Remove resource"
                    className="pressable shrink-0 text-muted hover:text-red transition-colors"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Remind before deadline
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
              {reminders.map((r, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border border-border bg-surface p-2">
                  <select
                    value={String(r.offset_hours)}
                    onChange={(e) => {
                      const next = [...reminders];
                      next[index].offset_hours = Number(e.target.value);
                      setReminders(next);
                    }}
                    className="text-[11px] bg-transparent border-none focus:ring-0"
                  >
                    <option value="168">1 week before</option>
                    <option value="72">3 days before</option>
                    <option value="24">1 day before</option>
                    <option value="12">12 hours before</option>
                    <option value="1">1 hour before</option>
                  </select>
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
              ))}
            </div>
          </div>

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
              {assessment ? "Save changes" : "Create assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
