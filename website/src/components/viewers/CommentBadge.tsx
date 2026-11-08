"use client";

import * as React from "react";
import { MessageCircle, X, Check, Plus } from "lucide-react";
import { useCommentsContext } from "@/components/viewers/comments-context";
import { CommentThreadPanel } from "@/components/viewers/CommentThreadPanel";
import { cn } from "@/lib/utils";

interface CommentBadgeProps {
  targetType: string;
  targetSelector: unknown;
  label?: string;
  /**
   * Show even when there is nothing to show yet. Viewers flip this on with
   * their annotate toggle so the reader can drop a first comment on any
   * anchor without a permanent badge on every line.
   */
  annotate?: boolean;
}

/**
 * The anchor marker for one commentable spot (a line, a slide, a cell, a
 * page).
 *
 * Console rules: nothing renders at rest unless the file already carries a
 * comment there, or the reader has asked to annotate. A badge that is always
 * on the page teaches the eye to ignore it. On phones the thread opens as a
 * bottom sheet; on desktop it stays anchored under the badge.
 */
export default function CommentBadge({
  targetType,
  targetSelector,
  label,
  annotate = false,
}: CommentBadgeProps) {
  const { comments, loading, create } = useCommentsContext();
  const [open, setOpen] = React.useState(false);
  const [newBody, setNewBody] = React.useState("");

  const fileComments = comments.filter(
    (c) =>
      c.comment.target_type === targetType &&
      JSON.stringify(c.comment.target_selector) ===
        JSON.stringify(targetSelector)
  );
  const count = fileComments.length;
  const existing = fileComments[0];

  const createComment = async (body: string) => {
    await create({ targetType, targetSelector, body });
    setNewBody("");
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (loading) return null;
  if (count === 0 && !annotate && !open) return null;

  const countChip = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={label ?? "Open comments"}
      className={cn(
        "pressable flex h-7 items-center gap-1.5 rounded-md border px-1.5 font-mono text-[10px] font-semibold transition-colors max-sm:h-8 max-sm:px-2",
        count > 0
          ? "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
          : "border-dashed border-border-strong bg-background/70 text-muted backdrop-blur-sm hover:border-accent/50 hover:text-accent"
      )}
    >
      {count > 0 ? (
        <>
          <MessageCircle size={11} aria-hidden="true" strokeWidth={2.4} />
          {count}
        </>
      ) : (
        <>
          <Plus size={11} aria-hidden="true" strokeWidth={2.4} />
          <span className="sr-only">Add comment</span>
        </>
      )}
    </button>
  );

  return (
    <div className="relative inline-flex">
      {countChip}

      {open && (
        <>
          {/* Backdrop only on phones, where the thread is a sheet. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close comments"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-[2px] sm:hidden"
          />
          <div
            role="dialog"
            aria-label={label ?? "Comments"}
            className={cn(
              "z-50",
              // Phone: bottom sheet.
              "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[68dvh] max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:rounded-t-2xl max-sm:border-t max-sm:border-border-strong max-sm:bg-surface-raised max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:pt-2 max-sm:shadow-lift",
              // Desktop: anchored card.
              "sm:absolute sm:right-0 sm:top-full sm:z-50 sm:mt-2 sm:w-[380px] sm:rounded-lg sm:border sm:border-border-strong sm:bg-surface-raised sm:p-3 sm:shadow-lift"
            )}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong sm:hidden"
            />
            {existing ? (
              <CommentThreadPanel
                commentId={existing.comment.id}
                onClose={() => setOpen(false)}
              />
            ) : (
              <div>
                <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-accent">
                  New comment
                </p>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.currentTarget.value)}
                  placeholder="Write a comment…"
                  rows={3}
                  autoFocus
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[12.5px] text-foreground outline-none placeholder:text-muted focus-visible:border-accent"
                />
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBody("");
                      setOpen(false);
                    }}
                    className="pressable text-[11px] font-medium text-muted transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBody.trim()) return;
                      void createComment(newBody.trim());
                    }}
                    disabled={!newBody.trim()}
                    aria-label="Post comment"
                    className="pressable grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Check size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
