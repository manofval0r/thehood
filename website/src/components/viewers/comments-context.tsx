"use client";

import * as React from "react";
import { useComments } from "@/components/viewers/useComments";

/**
 * One fetch of a file's comments, shared by every badge and thread in the
 * viewer.
 *
 * Before this, each CommentBadge on a page ran its own useComments and each
 * fetched the whole thread list: a 200-line text file asked the server for
 * the same payload two hundred times. Badges now read from this context, so
 * one file means one request.
 */

export type CommentsApi = ReturnType<typeof useComments>;

const CommentsContext = React.createContext<CommentsApi | null>(null);

export function CommentsProvider({
  fileId,
  fileKind,
  children,
}: {
  fileId: string;
  fileKind: string;
  children: React.ReactNode;
}) {
  const api = useComments({ fileId, fileKind });
  return (
    <CommentsContext.Provider value={api}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useCommentsContext(): CommentsApi {
  const ctx = React.useContext(CommentsContext);
  if (!ctx) {
    // A badge outside a provider is a wiring mistake, not a user error.
    throw new Error("Comments components must be used inside <CommentsProvider>");
  }
  return ctx;
}
