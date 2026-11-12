import { NextResponse } from "next/server";
import { connection } from "next/server";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  getAssignmentByShareToken,
  generateShareToken,
  updateAssignment,
} from "@/lib/assignments-server";
import { validateAssignmentBody } from "@/lib/assignment-validation";
import { ownerTokenFor, ownerTokenMatches } from "@/lib/owner-token";
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/staff";

/**
 * Course assignments.
 *
 * Reading is public. Setting an assignment is open to everyone, matching
 * the old assessments page's openness: no sign-in, no roster check. Because
 * creation is public, management is scoped instead of admin-gated: each
 * creator receives a deterministic owner token at creation time and the
 * server verifies it on edits and deletes. Staff can always edit or delete
 * anything, which is the moderation path for a public board.
 */

export async function GET(request: Request) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get("share_token");
    const idParam = searchParams.get("id");

    if (idParam) {
      const assignment = await getAssignmentById(idParam);
      if (!assignment) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(assignment);
    }

    if (shareToken) {
      const assignment = await getAssignmentByShareToken(shareToken);
      if (!assignment) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(assignment);
    }

    const rows = await getAssignments();
    return NextResponse.json(rows);
  } catch {
    // The assignments table may not exist yet until the migration is run.
    // Return an empty list so the page still loads.
    return NextResponse.json([]);
  }
}

/* ---------- throttling for the open form ---------- */

/**
 * A per-instance speed bump. Serverless instances each keep their own
 * counter, so this does not stop a distributed hammering — that is what
 * staff moderation is for. It stops one page refresh loop from filling the
 * table.
 */
const createTimes: number[] = [];
const MAX_CREATES_PER_HOUR = 30;

function creationAllowanceExhausted(): boolean {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  while (createTimes.length > 0 && createTimes[0] < cutoff) createTimes.shift();
  if (createTimes.length >= MAX_CREATES_PER_HOUR) return true;
  createTimes.push(now);
  return false;
}

/* ---------- who may manage what ---------- */

/** Staff always may; otherwise the caller must hold the creator's token. */
async function callerCanManage(id: string, request: Request): Promise<boolean> {
  const me = await currentStaff();
  if (me && can(me, "staff")) return true;
  return ownerTokenMatches(id, request.headers.get("x-owner-token"));
}

function notYours(message = "You can only manage assignments you set") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function POST(request: Request) {
  await connection();

  if (creationAllowanceExhausted()) {
    return NextResponse.json(
      { error: "Too many assignments just now — try again in a bit" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateAssignmentBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const assignment = await createAssignment(validated.value);
    // The creator's proof of ownership. Only they get it; anyone holding it
    // can edit or delete this one assignment.
    const ownerToken = ownerTokenFor(assignment.id);
    return NextResponse.json({ assignment, ownerToken }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!(await callerCanManage(id, request))) return notYours();

  try {
    await deleteAssignment(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!(await callerCanManage(id, request))) return notYours();

  if (action === "generate_share") {
    try {
      const shareUrl = await generateShareToken(id);
      return NextResponse.json({ shareUrl });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate share link" },
        { status: 500 }
      );
    }
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // The card's "mark done" button sends exactly { done }. Handle it without
  // demanding the whole assignment back.
  const doneOnly =
    Object.keys(body as Record<string, unknown>).length === 1 &&
    typeof (body as Record<string, unknown>).done === "boolean";

  if (doneOnly) {
    try {
      await updateAssignment(id, {
        done: (body as Record<string, unknown>).done as boolean,
      });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update" },
        { status: 500 }
      );
    }
  }

  const validated = validateAssignmentBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    await updateAssignment(id, validated.value);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
