"use client";

import * as React from "react";
import {
  ChevronRight,
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
} from "lucide-react";
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
}

export function AssignmentCard({
  assessment,
  now,
  onDelete,
  onEdit,
  onToggleDone,
}: AssignmentCardProps) {
  const remainingMs = remainingMsFor(assessment.due_at, now);
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  const isOverdue = remainingMs <= 0;
  const isDueSoon = remainingMs > 0 && remainingMs < 7 * 24 * 60 * 60 * 1000;

  const toggleDone = async () => {
    await fetch(`/api/assignments?id=${assessment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !assessment.done }),
    });
    onToggleDone(assessment.id, !assessment.done);
  };
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

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover",
        isOverdue ? "border-red/30" : isDueSoon ? "border-amber/30" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-8 w-8 rounded flex items-center justify-center",
                typeColour(assessment.type).split(" ")[0]
              )}
            >
              {assessment.type === "group" ? <Users size={13} /> : <Clock size={13} />}
            </span>
            <span className="text-[13px] font-semibold text-foreground">
              {assessment.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(assessment);
              }}
              aria-label="Edit assignment"
              className="pressable shrink-0 grid h-8 w-8 place-items-center rounded text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDone();
              }}
              aria-label={assessment.done ? "Mark as not done" : "Mark as done"}
              className={cn(
                "pressable shrink-0 grid h-8 w-8 place-items-center rounded",
                assessment.done
                  ? "text-accent bg-accent/10"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {assessment.done ? (
                <CheckCircle2 size={13} className="text-accent" />
              ) : (
                <Check size={13} />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assessment.id);
              }}
              aria-label="Delete assignment"
              className="pressable shrink-0 grid h-8 w-8 place-items-center rounded text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {assessment.done && (
        <div className="absolute inset-0 rounded-xl border border-accent bg-accent/10 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
            Done
          </span>
        </div>
      )}
      <div className="space-y-2">
        {/* Course. */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {assessment.course_code}
          </span>
          <span className="text-[12px] text-muted-foreground truncate">
            {assessment.course_title}
          </span>
        </div>

        {/* Type + submit method. */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium",
              typeColour(assessment.type)
            )}
          >
            {typeLabel(assessment.type)}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-muted">
            {submitIcon}
            <span>{submitMethodLabel(assessment.submit_method)}</span>
          </div>
        </div>

        {/* Due date. */}
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-muted" />
          <span className={cn("text-[12px] font-medium", isOverdue ? "text-red" : "text-foreground")}>
            {formatRemaining(remainingMs)}
          </span>
          {assessment.event_title && (
            <span className="text-[11px] text-muted">
              · Event: {assessment.event_title}
            </span>
          )}
        </div>

        {/* Notification frequency. */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Remind
          </span>
          <span className="text-[12px] text-muted-foreground">
            {notificationFrequencyLabel(assessment.notification_frequency)}
          </span>
        </div>

        {/* Notes. */}
        {assessment.notes && (
          <div className="mt-2">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {assessment.notes}
            </p>
          </div>
        )}

        {/* Resources. */}
        {assessment.resources.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-1">
              Resources
            </p>
            {assessment.resources.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface/50 p-2"
              >
                {r.type === "youtube" ? (
                  <Play size={12} className="text-red" />
                ) : (
                  <Upload size={12} className="text-muted" />
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-muted truncate flex-1 hover:text-accent transition-colors"
                >
                  {r.title || r.url}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with due time + submit detail. */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted">Due</span>
          <span className={cn("text-[11px] font-medium", isOverdue ? "text-red" : "text-foreground")}>
            {new Date(assessment.due_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {assessment.submit_method === "email" && assessment.submit_detail && (
          <a
            href={`mailto:${assessment.submit_detail}`}
            className="flex items-center gap-1 text-[12px] text-accent hover:underline"
          >
            <Mail size={12} />
            Submit by email
          </a>
        )}
      </div>
    </article>
  );
}
