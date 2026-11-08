"use client";

import * as React from "react";
import { MessageCircle, ChevronDown, X, Check } from "lucide-react";
import { useComments } from "@/components/viewers/useComments";
import { CommentThreadPanel } from "@/components/viewers/CommentThreadPanel";
import { cn } from "@/lib/utils";

interface CommentBadgeProps {
  fileId: string;
  fileKind: string;
  targetType: string;
  targetSelector: unknown;
  label?: string;
}

/**
 * Small badge pinned next to an anchor (a line of text, a slide, a table
 * cell). Tapping it opens the comment thread panel.
 *
 * On phones the badge sits in the page margin; tapping it opens a bottom
 * sheet with the comment thread. On desktop it opens a side panel.
 */
export default function CommentBadge({
  fileId,
  fileKind,
  targetType,
  targetSelector,
  label,
}: CommentBadgeProps) {
  const { comments, loading, create } = useComments({ fileId, fileKind });
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

  if (loading) return null;

  return (
    <div className="relative inline-block">
      {/* Badge button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label ?? "Open comments"}
        className={cn(
          "pressable flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-foreground transition-colors hover:bg-surface-hover hover:border-accent hover:text-accent",
          count > 0 && "bg-accent/10 text-accent border-accent/20"
        )}
      >
        <MessageCircle size={12} aria-hidden="true" />
        {count > 0 && (
          <span className="text-[10px] font-bold">{count}</span>
        )}
        <ChevronDown size={10} className="text-muted transition-transform" />
      </button>

      {/* Open state: existing thread or create form */}
      {open && (
        <div className="mt-2 z-50">
          {existing ? (
            <CommentThreadPanel
              commentId={existing.comment.id}
              fileId={fileId}
              fileKind={fileKind}
              onClose={() => setOpen(false)}
            />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-2">
                New comment
              </p>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.currentTarget.value)}
                placeholder="Write a comment…"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[12.5px] text-foreground outline-none focus-visible:border-accent resize-none disabled:opacity-50"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewBody("");
                    setOpen(false);
                  }}
                  className="pressable text-[11px] text-muted hover:text-accent transition-colors"
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
                  className="pressable shrink-0 grid h-7 w-7 place-items-center rounded bg-accent text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Check size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
