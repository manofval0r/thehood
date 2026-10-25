"use client";

import Link from "next/link";
import { X, Download, Bell, Clock, Edit2, Trash2 } from "lucide-react";
import { useSharedTick, studentId } from "@/hooks/useAssessments";
import {
  upcomingAssessments,
  formatRemaining,
  typeLabel,
  typeColour,
  type Assessment,
} from "@/lib/assessments";
import { cn } from "@/lib/utils";

interface AssessmentCardProps {
  assessment: Assessment;
  now: Date;
  onDelete?: (id: string) => void;
  onEdit?: (a: Assessment) => void;
  className?: string;
}

export function AssessmentCard({
  assessment,
  now,
  onDelete,
  onEdit,
  className,
}: AssessmentCardProps) {
  const { remainingMs, statusLabel, urgency, progress } = upcomingAssessments(
    [assessment],
    now
  )[0];
  const colour = typeColour(assessment.type);
  const isOverdue = urgency === "done";
  const isUrgent = urgency === "red" || urgency === "amber";

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-lg border p-5 transition-colors",
        isOverdue ? "border-red/30 bg-red/5" : "border-border bg-surface",
        className
      )}
    >
      <span className="card-cast" aria-hidden="true" />
      <span className="card-bevel" aria-hidden="true" />

      <div className="card-depth flex flex-col h-full" style={{ "--depth": "14px" } as React.CSSProperties}>
        {/* Header: type badge + urgency + actions. */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em]",
                colour
              )}
            >
              {typeLabel(assessment.type)}
            </span>
            {urgency !== "green" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em]",
                  urgency === "red" || urgency === "done"
                    ? "bg-red/10 border-red/20 text-red"
                    : "bg-amber/10 border-amber/20 text-amber"
                )}
              >
                <Clock size={12} aria-hidden="true" />
                {urgency === "done" ? "Overdue" : "Due soon"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(assessment)}
                aria-label="Edit assessment"
                className="pressable shrink-0 grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent max-sm:min-h-11"
              >
                <Edit2 size={16} aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(assessment.id)}
                aria-label="Remove assessment"
                className="pressable shrink-0 grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:border-red/50 hover:text-red max-sm:min-h-11"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Title. */}
        <h3
          className={cn(
            "card-depth mt-0 mb-1 text-[15px] font-semibold leading-snug text-foreground",
            isOverdue ? "text-red" : "text-foreground"
          )}
          style={{ "--depth": "24px" } as React.CSSProperties}
        >
          {assessment.title}
        </h3>
        <span
          className={cn(
            "card-depth mb-3 font-mono text-[11px] text-muted",
            isOverdue ? "text-red" : "text-muted"
          )}
          style={{ "--depth": "18px" } as React.CSSProperties}
        >
          {assessment.course_code}
        </span>

        {/* Countdown: the biggest thing on the card. */}
        <div className="card-depth flex-1 flex items-baseline gap-1" style={{ "--depth": "30px" } as React.CSSProperties}>
          <span className="text-[24px] font-bold leading-none tnum text-foreground md:text-32px">
            {formatRemaining(remainingMs)}
          </span>
          <span className="text-[12px] font-medium text-muted-foreground">
            {statusLabel}
          </span>
        </div>

        {/* Progress bar: % of time elapsed from notional start to deadline. */}
        <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface-hover">
          <div
            className="h-2"
            style={{
              width: `${Math.round(progress * 100)}%`,
              backgroundColor:
                urgency === "red" || urgency === "done"
                  ? "var(--red)"
                  : urgency === "amber"
                    ? "var(--amber)"
                    : "var(--green)",
            }}
          />
        </div>

        {/* Footer: deadline date + reminder bell. */}
        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-border/50">
          <span className="text-[11px] text-muted">
            {new Date(assessment.due_at).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            title="Set a browser reminder"
          >
            <Bell size={12} aria-hidden="true" />
            Remind me
          </span>
        </div>
      </div>
    </article>
  );
}
