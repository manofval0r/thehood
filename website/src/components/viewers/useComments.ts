"use client";

import * as React from "react";
import type { FileComment, FileCommentReply } from "@/lib/comments-server";

export interface UseCommentsArgs {
  fileId: string;
  fileKind: string;
}

/**
 * Comments for one file.
 *
 * Fetches all comments (and their replies) for a file, and offers create /
 * update / delete / resolve. A comment and its replies are kept together so
 * the UI renders one thread per comment.
 */
export function useComments({ fileId, fileKind }: UseCommentsArgs) {
  const [comments, setComments] = React.useState<
    Array<{ comment: FileComment; replies: FileCommentReply[] }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/comments?fileId=${encodeURIComponent(fileId)}&fileKind=${encodeURIComponent(fileKind)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load comments");
      const data = (await res.json()) as Array<{
        comment: FileComment;
        replies: FileCommentReply[];
      }>;
      setComments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [fileId, fileKind]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = async (args: {
    targetType: string;
    targetSelector: unknown;
    body: string;
  }) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId,
        fileKind,
        targetType: args.targetType,
        targetSelector: args.targetSelector,
        body: args.body,
      }),
    });
    if (!res.ok) throw new Error("Failed to create comment");
    const created = (await res.json()) as FileComment;
    setComments((prev) => [
      { comment: created, replies: [] },
      ...prev,
    ]);
    return created;
  };

  const createReply = async (commentId: string, body: string) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyBody: body }),
    });
    if (!res.ok) throw new Error("Failed to create reply");
    const reply = (await res.json()) as FileCommentReply;
    setComments((prev) =>
      prev.map((c) =>
        c.comment.id === commentId
          ? { ...c, replies: [...c.replies, reply] }
          : c
      )
    );
    return reply;
  };

  const update = async (commentId: string, body: string) => {
    const res = await fetch(
      `/api/comments?commentId=${encodeURIComponent(commentId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );
    if (!res.ok) throw new Error("Failed to update comment");
    setComments((prev) =>
      prev.map((c) =>
        c.comment.id === commentId
          ? { ...c, comment: { ...c.comment, body } }
          : c
      )
    );
  };

  const remove = async (commentId: string) => {
    const res = await fetch(
      `/api/comments?commentId=${encodeURIComponent(commentId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to delete comment");
    setComments((prev) => prev.filter((c) => c.comment.id !== commentId));
  };

  const resolve = async (commentId: string, resolved: boolean) => {
    const res = await fetch(
      `/api/comments?commentId=${encodeURIComponent(commentId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      }
    );
    if (!res.ok) throw new Error("Failed to update comment");
    setComments((prev) =>
      prev.map((c) =>
        c.comment.id === commentId
          ? { ...c, comment: { ...c.comment, resolved } }
          : c
      )
    );
  };

  return {
    comments,
    loading,
    error,
    create,
    createReply,
    update,
    remove,
    resolve,
    reload: load,
  };
}
