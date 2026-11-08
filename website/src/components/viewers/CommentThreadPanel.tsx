"use client";

import * as React from "react";
import {
  ChevronDown,
  Clock,
  X,
  Check,
  CheckCircle2,
  Trash2,
  Edit3,
  Reply,
  Users,
  FileText,
} from "lucide-react";
import { useComments } from "@/components/viewers/useComments";
import { cn } from "@/lib/utils";

interface CommentThreadPanelProps {
  commentId: string;
  fileId: string;
  fileKind: string;
  onClose: () => void;
  inline?: boolean; // true when shown inline (bottom), false when in panel/side sheet
}

/**
 * One comment thread: the comment, its replies, reply input, and resolve
 * controls. Shown either inline beneath an anchor (mobile bottom sheet) or
 * inside a side panel (desktop).
 *
 * All mutations go through the /api/comments route via useComments; no
 * server-only functions are imported here.
 */
export function CommentThreadPanel({
  commentId,
  fileId,
  fileKind,
  onClose,
  inline = false,
}: CommentThreadPanelProps) {
  const { comments, createReply, update, remove, resolve } = useComments({
    fileId,
    fileKind,
  });

  const commentData = comments.find((c) => c.comment.id === commentId);
  if (!commentData) return null;

  const { comment, replies } = commentData;
  const [editing, setEditing] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [busy, setBusy] = React.useState<boolean>(false);

  const authorName =
    comment.author_name ||
    (comment.author_id ? `Author ${comment.author_id.slice(-4)}` : "Someone");
  const created = new Date(comment.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await remove(comment.id);
    } catch {
      setBusy(false);
    }
  };

  const handleToggle = async () => {
    setBusy(true);
    try {
      await resolve(comment.id, !comment.resolved);
    } catch {
      setBusy(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      await createReply(comment.id, replyText.trim());
      setReplyText("");
    } catch {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textarea = e.currentTarget.querySelector("textarea") as HTMLTextAreaElement | null;
    const body = textarea?.value.trim() ?? "";
    if (!body) return;
    setBusy(true);
    try {
      await update(comment.id, body);
      setEditing(false);
    } catch {
      setBusy(false);
    }
  };

  const isDone = comment.resolved;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        inline ? "max-w-full" : "max-w-[420px]"
      )}
    >
      {/* Header: author, time, resolve status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold bg-surface-raised text-muted-foreground"
          >
            {authorName.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-foreground leading-none">
              {authorName}
            </span>
            <span className="text-[10.5px] text-muted">
              {created}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {comment.author_id && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className={cn(
                "pressable shrink-0 grid h-7 w-7 place-items-center rounded text-[10px] font-medium transition-colors",
                comment.resolved
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted border border-border hover:bg-surface-hover hover:text-foreground"
              )}
              aria-label={comment.resolved ? "Mark as not done" : "Mark as done"}
            >
              {comment.resolved ? (
                <Check size={13} className="text-accent" />
              ) : (
                <CheckCircle2 size={13} className="text-muted" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="pressable shrink-0 grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="prose prose-sm text-[13px] leading-relaxed max-w-none">
        {comment.body.split("\n").map((line, i) => (
          <p key={i} className="my-1">
            {line}
          </p>
        ))}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            {replies.length} reply{replies.length === 1 ? "" : "s"}
          </span>
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="flex flex-col gap-1"
            >
              <div className="flex items-start gap-2">
                <span
                  className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold bg-surface text-muted-foreground"
                >
                  {reply.author_name?.slice(0, 2).toUpperCase() ?? "??"}
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[11.5px] font-medium text-foreground">
                    {reply.author_name || "Someone"}
                  </span>
                  <span className="text-[10px] text-muted">
                    {new Date(reply.created_at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed text-foreground ml-7">
                {reply.body}
              </p>
              {reply.author_id && (
                <button
                  type="button"
                  onClick={() => remove(reply.id)}
                  className="pressable shrink-0 text-[10px] text-muted hover:text-red transition-colors"
                  aria-label="Delete reply"
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <form onSubmit={handleSubmitReply} className="flex flex-col gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.currentTarget.value)}
            placeholder="Write a reply…"
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground outline-none focus-visible:border-accent resize-none disabled:opacity-50"
            disabled={busy}
            maxLength={1000}
          />
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] text-muted">
              {replyText.length}/1000
            </span>
            <button
              type="submit"
              disabled={!replyText.trim() || busy}
              className="pressable shrink-0 grid h-7 w-7 place-items-center rounded bg-accent text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Send reply"
            >
              <Reply size={12} />
            </button>
          </div>
        </form>
      </div>

      {/* Edit form (replaces body when editing)} */}
      {editing && comment.author_id && (
        <div className="border-t border-border pt-3">
          <form onSubmit={handleUpdate} className="flex flex-col gap-2">
            <textarea
              defaultValue={comment.body}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground outline-none focus-visible:border-accent resize-none disabled:opacity-50"
              disabled={busy}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="pressable text-[11px] text-muted hover:text-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="pressable shrink-0 grid h-7 w-7 place-items-center rounded bg-accent text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
              >
                <Reply size={12} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Owner controls */}
      {comment.author_id && (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
          {editing ? null : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={busy}
                className="pressable text-[11px] font-medium text-muted hover:text-accent transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="pressable text-[11px] font-medium text-muted hover:text-red transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
