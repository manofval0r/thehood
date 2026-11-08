import { NextResponse } from "next/server";
import { connection } from "next/server";
import {
  createComment,
  createReply,
  deleteComment,
  getCommentReplies,
  getFileComments,
  resolveComment,
  updateComment,
} from "@/lib/comments-server";

type CommentWithReplies = {
  comment: import("@/lib/comments-server").FileComment;
  replies: import("@/lib/comments-server").FileCommentReply[];
};

export async function GET(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  const fileKind = searchParams.get("fileKind");
  const commentId = searchParams.get("commentId");

  if (!fileId || !fileKind) {
    return NextResponse.json(
      { error: "fileId and fileKind are required" },
      { status: 400 }
    );
  }

  try {
    const comments = await getFileComments(fileId, fileKind);
    const out: CommentWithReplies[] = [];
    for (const comment of comments) {
      let replies: import("@/lib/comments-server").FileCommentReply[] = [];
      if (commentId === comment.id) {
        replies = await getCommentReplies(comment.id);
      }
      out.push({ comment, replies });
    }
    return NextResponse.json(out);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const payload = await request.json();
    const {
      fileId,
      fileKind,
      targetType,
      targetSelector,
      commentBody,
      commentId,
      replyBody,
    } = payload;

    if (!fileId || !fileKind || !targetType || targetSelector === undefined || !commentBody) {
      return NextResponse.json({ error: "fileId, fileKind, targetType, targetSelector and body are required" }, { status: 400 });
    }

    if (commentId) {
      const reply = await createReply({ commentId, body: replyBody ?? commentBody });
      return NextResponse.json(reply, { status: 201 });
    }

    const comment = await createComment({ fileId, fileKind, targetType, targetSelector, body: commentBody });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  const payload = await request.json();
  const { resolved, body } = payload;

  if (resolved !== undefined) {
    try {
      await resolveComment({ commentId, resolved });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to resolve comment" },
        { status: 500 }
      );
    }
  }

  if (body !== undefined) {
    try {
      await updateComment({ commentId, body });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update comment" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "body or resolved is required" }, { status: 400 });
}

export async function DELETE(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId is required" }, { status: 400 });
  }

  try {
    await deleteComment(commentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete comment" },
      { status: 500 }
    );
  }
}
