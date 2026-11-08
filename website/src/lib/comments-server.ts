import "server-only";

import { rest } from "@/lib/rest";
import { currentStaff } from "@/lib/admin-session";
import { currentStudent } from "@/lib/student-session";

export interface CommentAuthor {
  id: string;
  name: string;
  kind: "staff" | "student";
}

export interface FileComment {
  id: string;
  file_id: string;
  file_kind: string;
  target_type: string;
  target_selector: unknown;
  body: string;
  author_id: string | null;
  author_name: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileCommentReply {
  id: string;
  comment_id: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

/** Who is making the comment: staff session or student session. */
async function currentAuthor(): Promise<CommentAuthor | null> {
  const staff = await currentStaff();
  if (staff) {
    return {
      id: staff.id,
      name: staff.name,
      kind: "staff",
    };
  }
  const student = await currentStudent();
  if (student) {
    return {
      id: student.matric,
      name: student.name,
      kind: "student",
    };
  }
  return null;
}

export async function getFileComments(
  fileId: string,
  fileKind: string
): Promise<FileComment[]> {
  const rows = await rest<FileComment[]>(
    `file_comments?file_id=eq.${encodeURIComponent(fileId)}&file_kind=eq.${encodeURIComponent(fileKind)}&select=*&order=created_at.asc`
  );
  return rows ?? [];
}

export async function getCommentReplies(commentId: string): Promise<FileCommentReply[]> {
  const rows = await rest<FileCommentReply[]>(
    `file_comment_replies?comment_id=eq.${encodeURIComponent(commentId)}&select=*&order=created_at.asc`
  );
  return rows ?? [];
}

export interface CreateCommentArgs {
  fileId: string;
  fileKind: string;
  targetType: string;
  targetSelector: unknown;
  body: string;
}

export async function createComment(args: CreateCommentArgs) {
  const author = await currentAuthor();
  if (!author) {
    throw new Error("You must be signed in to comment.");
  }

  const row = {
    file_id: args.fileId,
    file_kind: args.fileKind,
    target_type: args.targetType,
    target_selector: args.targetSelector,
    body: args.body,
    author_id: author.id,
    author_name: author.name,
  };

  const created = await rest<FileComment[]>("file_comments", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });

  return created[0] as FileComment;
}

export interface CreateReplyArgs {
  commentId: string;
  body: string;
}

export interface CreateReplyArgs {
  commentId: string;
  body: string;
}

export async function createReply(args: CreateReplyArgs) {
  const author = await currentAuthor();
  if (!author) {
    throw new Error("You must be signed in to reply.");
  }

  const row = {
    comment_id: args.commentId,
    author_id: author.id,
    author_name: author.name,
    body: args.body,
  };

  const created = await rest<FileCommentReply[]>("file_comment_replies", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  });

  return created[0] as FileCommentReply;
}

export interface UpdateCommentArgs {
  commentId: string;
  body: string;
}

export async function updateComment(args: UpdateCommentArgs) {
  const author = await currentAuthor();
  if (!author) {
    throw new Error("You must be signed in to edit a comment.");
  }

  await rest(
    `file_comments?id=eq.${encodeURIComponent(args.commentId)}&author_id=eq.${encodeURIComponent(author.id)}`,
    {
      method: "PATCH",
      body: { body: args.body, updated_at: new Date().toISOString() },
    }
  );
}

export async function deleteComment(commentId: string) {
  const author = await currentAuthor();
  if (!author) {
    throw new Error("You must be signed in to delete a comment.");
  }

  await rest(
    `file_comments?id=eq.${encodeURIComponent(commentId)}&author_id=eq.${encodeURIComponent(author.id)}`,
    {
      method: "DELETE",
    }
  );
}

export interface ResolveCommentArgs {
  commentId: string;
  resolved: boolean;
}

export async function resolveComment(args: ResolveCommentArgs) {
  const author = await currentAuthor();
  if (!author) {
    throw new Error("You must be signed in to change a comment's state.");
  }

  await rest(
    `file_comments?id=eq.${encodeURIComponent(args.commentId)}&author_id=eq.${encodeURIComponent(author.id)}`,
    {
      method: "PATCH",
      body: {
        resolved: args.resolved,
        resolved_at: args.resolved ? new Date().toISOString() : null,
      },
    }
  );
}
