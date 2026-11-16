"use client";

import * as React from "react";
import {
  Clock,
  Users,
  Mail,
  Presentation,
  MapPin,
  Link,
  Play,
  Upload,
  Trash2,
  Pencil,
  Check,
  CheckCircle2,
  Share2,
} from "lucide-react";
import AddToCalendar from "@/components/AddToCalendar";
import { youtubeId } from "@/lib/calendar-links";
import {
  formatRemaining,
  remainingMsFor,
  submitMethodLabel,
  notificationFrequencyLabel,
  typeLabel,
  typeColour,
  type Assignment,
} from "@/lib/assignments";
import { cn } from "@/lib/utils";

interface AssignmentCardProps {
  assessment: Assignment;
  now: Date;
  onDelete: (id: string) => void;
  onEdit: (a: Assignment) => void;
  onToggleDone: (id: string, done: boolean) => void;
  /** Hide staff controls (edit, delete, mark done). The share view uses this. */
  readOnly?: boolean;
  /**
   * Hide the management controls specifically. False for assignments this
   * browser did not create and are not staff's — the write endpoints would
   * refuse them anyway, this just keeps the card honest. Defaults to true
   * so existing call sites keep working.
   */
  canManage?: boolean;
}

export function ResourceRow({
  url,
  type,
  title,
}: {
  url: string;
  type: "youtube" | "upload";
  title: string;
}) {
  const [thumbBroken, setThumbBroken] = React.useState(false);
  const yt = type === "youtube" ? youtubeId(url) : null;

  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="pressable flex min-w-0 items-center gap-2.5 rounded-md bg-surface-hover p-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        {yt && !thumbBroken ? (
          <span className="relative h-11 w-[4.75rem] shrink-0 overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              onError={() => setThumbBroken(true)}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-px font-mono text-[8px] font-bold text-red">
              ▶
            </span>
          </span>
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-surface-raised">
            {type === "youtube" ? (
              <Play size={15} className="text-red" aria-hidden="true" />
            ) : (
              <Upload size={15} className="text-accent" aria-hidden="true" />
            )}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{title}</span>
      </a>
    </li>
  );
}

export function AssignmentCard({
  assessment,
  now,
  onDelete,
  onEdit,
  onToggleDone,
  readOnly = false,
  canManage = true,
}: AssignmentCardProps) {
  // This crosses a network boundary; a stale or partial row must not
  // crash the page the way `resources.length` did.
  const resources = assessment.resources ?? [];
  const remainingMs = remainingMsFor(assessment.due_at, now);
  const days = Math.max(0, Math.floor(remainingMs / (24 * 60 * 60 * 1000)));

  const isOverdue = remainingMs <= 0;
  const isDueNow = !isOverdue && days === 0;
  const isDueSoon = remainingMs > 0 && remainingMs < 3 * 24 * 60 * 60 * 1000;
  const isDone = assessment.done;

  const toggleDone = () => {
    onToggleDone(assessment.id, !assessment.done);
  };

  const shareUrl = assessment.share_token
    ? `${window.location.origin}/assignments/${assessment.id}?share=${assessment.share_token}`
    : null;

  const submitIcon =
    assessment.submit_method === "email" ? (
      <Mail size={13} />
    ) : assessment.submit_method === "presentation" ? (
      <Presentation size={13} />
    ) : assessment.submit_method === "inperson" ? (
      <MapPin size={13} />
    ) : (
      <Link size={13} />
    );

  const dueTone = isDone
    ? "text-muted"
    : isOverdue
      ? "text-red"
      : isDueSoon || isDueNow
        ? "text-amber"
        : "text-foreground";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors",
        isDone ? "opacity-75" : "hover:border-border-strong hover:bg-surface-hover"
      )}
    >
      {/* Top row: type icon + title + stamp. */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            typeColour(assessment.type).split(" ")[0]
          )}
        >
          {assessment.type === "group" ? <Users size={15} /> : <Clock size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-[14px] font-semibold leading-snug tracking-tight text-foreground text-pretty",
              isDone && "line-through decoration-border-strong decoration-2"
            )}
          >
            {assessment.title}
          </h3>
          <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            {assessment.course_code} · {assessment.course_title}
          </p>
        </div>

        {/* Countdown stamp. */}
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted">
            {isOverdue ? "Overdue" : isDueNow ? "Today" : "Due in"}
          </span>
          <span
            className={cn(
              "font-mono text-[26px] font-semibold leading-none tabular-nums",
              dueTone
            )}
          >
            {isOverdue ? "00" : days}
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted">
            {days === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      {/* Meta chips + calendar shortcut. */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]",
            typeColour(assessment.type)
          )}
        >
          {typeLabel(assessment.type)}
        </span>
        <span className="flex items-center gap-1.5 rounded bg-surface-hover px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {submitIcon}
          {submitMethodLabel(assessment.submit_method)}
        </span>
        <span className="rounded bg-surface-hover px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          Remind: {notificationFrequencyLabel(assessment.notification_frequency)}
        </span>
        {assessment.event_title && (
          <span className="rounded bg-amber/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber">
            In class: {assessment.event_title}
          </span>
        )}
        <AddToCalendar
          className="ml-auto"
          uid={`assignment:${assessment.id}`}
          event={{
            title: `Assignment: ${assessment.title}`,
            dueAt: assessment.due_at,
            details: [
              `${assessment.course_code} · ${assessment.course_title}`,
              assessment.submit_method === "email" && assessment.submit_detail
                ? `Submit by email to ${assessment.submit_detail}`
                : assessment.submit_detail
                  ? `${submitMethodLabel(assessment.submit_method)}: ${assessment.submit_detail}`
                  : submitMethodLabel(assessment.submit_method),
              assessment.event_title ? `In class: ${assessment.event_title}` : null,
              assessment.notes || null,
            ]
              .filter(Boolean)
              .join("\n"),
            location:
              (assessment.submit_method === "inperson" ||
                assessment.submit_method === "presentation") &&
              assessment.submit_detail
                ? assessment.submit_detail
                : undefined,
          }}
        />
      </div>

      {/* Notes. */}
      {assessment.notes && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
          {assessment.notes}
        </p>
      )}

      {/* Resources. */}
      {resources.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {resources.map((r) => (
            <ResourceRow key={r.id} url={r.url} type={r.type} title={r.title} />
          ))}
        </ul>
      )}

      {/* Spacer pushes the footer to the bottom on tall cards. */}
      <div aria-hidden="true" className="min-h-3 flex-1" />

      {/* Footer: full due date + actions. Tone step, not a rule. */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-surface-hover px-2.5 py-2">
        <span className={cn("tnum text-[11px] font-medium", dueTone)}>
          {new Date(assessment.due_at).toLocaleString("en-GB", {
            timeZone: "Africa/Lagos", day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="flex items-center gap-0.5">
          {assessment.submit_method === "email" && assessment.submit_detail && (
            <a
              href={`mailto:${assessment.submit_detail}`}
              aria-label={`Submit by email to ${assessment.submit_detail}`}
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-accent"
            >
              <Mail size={14} aria-hidden="true" />
            </a>
          )}
          {shareUrl && !readOnly && canManage && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open share link"
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-accent"
            >
              <Share2 size={14} aria-hidden="true" />
            </a>
          )}
          {!readOnly && canManage && (
            <>
              <button
                type="button"
                onClick={onEdit.bind(null, assessment)}
                aria-label="Edit assignment"
                className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(assessment.id)}
                aria-label="Delete assignment"
                className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-red"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggleDone}
                aria-pressed={isDone}
                aria-label={isDone ? "Mark as not done" : "Mark as done"}
                title={isDone ? "Mark as not done" : "Mark as done"}
                className={cn(
                  "pressable ml-0.5 grid h-9 w-9 place-items-center rounded-md transition-colors",
                  isDone
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-surface hover:text-accent"
                )}
              >
                {isDone ? (
                  <CheckCircle2 size={15} aria-hidden="true" />
                ) : (
                  <Check size={15} aria-hidden="true" strokeWidth={2.5} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
