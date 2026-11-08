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
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/staff";

/**
 * Course assignments.
 *
 * Staff create and manage assignments for their courses. Anybody can read
 * them; only a signed-in member of staff may create, change or remove one.
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

export async function POST(request: Request) {
  await connection();
  const me = await currentStaff();
  if (!me || !can(me, "staff")) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const body = await request.json();
  const {
    courseCode,
    courseTitle,
    title,
    type,
    dueAt,
    submitMethod,
    submitDetail,
    notes,
    eventTitle,
    eventAt,
    notificationFrequency,
    customReminderHours,
    resources,
    reminders,
  } = body;

  if (
    !courseCode ||
    !courseTitle ||
    !title ||
    !type ||
    !dueAt ||
    !submitMethod
  ) {
    return NextResponse.json(
      {
        error:
          "courseCode, courseTitle, title, type, dueAt and submitMethod are required",
      },
      { status: 400 }
    );
  }

  try {
    const assignment = await createAssignment({
      courseCode,
      courseTitle,
      title,
      type,
      dueAt,
      submitMethod,
      submitDetail: submitDetail ?? "",
      notes: notes ?? "",
      eventTitle: eventTitle ?? "",
      eventAt: eventAt ?? null,
      notificationFrequency: notificationFrequency ?? "once",
      customReminderHours: customReminderHours ?? null,
      resources: resources ?? [],
      reminders: reminders ?? [],
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await connection();
  const me = await currentStaff();
  if (!me || !can(me, "staff")) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

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
  const me = await currentStaff();
  if (!me || !can(me, "staff")) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

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

  const body = await request.json();
  try {
    await updateAssignment(id, body);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
