"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  X,
  Reply,
  Trash2,
} from "lucide-react";
import { useCommentsContext } from "@/components/viewers/comments-context";
import { cn } from "@/lib/utils";

interface CommentThreadPanelProps {
  commentId: string;
  onClose: () => void;
}

/**
 * One comment thread: the comment, its replies, reply input, and resolve
 * controls. Sits inside the bottom sheet (mobile) or the anchored card
 * (desktop) that CommentBadge renders.
 *
 * All mutations go through /api/comments via the shared comments context; no
 * server-only functions are imported here, and every component on the page
 * reads from the same fetch.
 */
export function CommentThreadPanel({
  commentId,
  onClose,
}: CommentThreadPanelProps) {
  const { comments, createReply, update, remove, resolve } =
    useCommentsContext();

  const commentData = comments.find((c) => c.comment.id === commentId);

  const [editing, setEditing] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [editText, setEditText] = React.useState("");
  const [busy, setBusy] = React.useState<boolean>(false);

  // Rules of hooks: the early return above can change which comment is
  // selected between renders, so hooks must run unconditionally.
  React.useEffect(() => {
    if (commentData) setEditText(commentData.comment.body);
    // Only seed when the target changes, not on every keystroke of the edit box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentData?.comment.id]);

  if (!commentData) return null;

  const { comment, replies } = commentData;

  const authorName =
    comment.author_name ||
    (comment.author_id ? `Author ${comment.author_id.slice(-4)}` : "Someone");
  const initials = authorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const created = new Date(comment.created_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await remove(comment.id);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleResolved = async () => {
    setBusy(true);
    try {
      await resolve(comment.id, !comment.resolved);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = replyText.trim();
    if (!body) return;
    setBusy(true);
    try {
      await createReply(comment.id, body);
      setReplyText("");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    const body = editText.trim();
    if (!body) return;
    setBusy(true);
    try {
      await update(comment.id, body);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const isResolved = comment.resolved;

  return (
    <div className="flex flex-col gap-3">
      {/* Header: author, time, resolve */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-accent/25 bg-accent/10 font-mono text-[10px] font-semibold text-accent"
          >
            {initials || "?"}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-semibold leading-tight text-foreground">
              {authorName}
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
              {created}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {comment.author_id && (
            <button
              type="button"
              onClick={handleToggleResolved}
              disabled={busy}
              className={cn(
                "pressable grid h-9 w-9 place-items-center rounded-md border transition-colors disabled:opacity-50",
                isResolved
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground"
              )}
              aria-pressed={isResolved}
              aria-label={isResolved ? "Mark as not resolved" : "Mark resolved"}
              title={isResolved ? "Mark as not resolved" : "Mark resolved"}
            >
              {isResolved ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={15} aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close comments"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body or edit */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.currentTarget.value)}
            rows={3}
            autoFocus
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[12.5px] leading-relaxed text-foreground outline-none focus-visible:border-accent"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditText(comment.body);
              }}
              className="pressable text-[11px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={busy || !editText.trim()}
              className="pressable rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
          {comment.body}
        </p>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-3">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-hover font-mono text-[8.5px] font-semibold text-muted-foreground"
              >
                {(reply.author_name ?? "??").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-semibold text-foreground">
                    {reply.author_name || "Someone"}
                  </span>
                  <span className="font-mono text-[8.5px] text-muted">
                    {new Date(reply.created_at).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {reply.author_id && (
                    <button
                      type="button"
                      onClick={() => void remove(reply.id)}
                      className="pressable ml-auto shrink-0 text-muted transition-colors hover:text-red"
                      aria-label="Delete reply"
                    >
                      <Trash2 size={11} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
                  {reply.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      <form onSubmit={handleSubmitReply} className="flex flex-col gap-2 border-t border-border pt-3">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.currentTarget.value)}
          placeholder="Write a reply…"
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground outline-none placeholder:text-muted focus-visible:border-accent"
          disabled={busy}
          maxLength={1000}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] text-muted">
            {replyText.length}/1000
          </span>
          <div className="flex items-center gap-2">
            {comment.author_id && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="pressable rounded-md px-2.5 py-1.5 text-[10.5px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                Edit
              </button>
            )}
            {comment.author_id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="pressable rounded-md px-2.5 py-1.5 text-[10.5px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-red"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={!replyText.trim() || busy}
              className="pressable grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Send reply"
            >
              <Reply size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
