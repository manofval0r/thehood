import { NextResponse } from "next/server";
import { connection } from "next/server";
import {
  createAssessment,
  deleteAssessment,
  getAssessments,
  updateAssessment,
} from "@/lib/assessments-server";
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/staff";

/**
 * Assessments.
 *
 * Students track their own tests, exams and assignments. Anybody can read
 * them; only a signed-in member of staff may create, change or remove one.
 * A student's own assessments are scoped by a student id they supply.
 */

export async function GET(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id") ?? undefined;
  try {
    const rows = await getAssessments(studentId);
    return NextResponse.json(rows);
  } catch {
    // The assessments table may not exist yet until the migration is run.
    // Return an empty list so the page still loads and the student can add
    // assessments once the table is created.
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
  const { courseCode, title, type, dueAt, studentId, reminders } = body;

  if (!courseCode || !title || !type || !dueAt || !studentId) {
    return NextResponse.json(
      { error: "courseCode, title, type, dueAt and studentId are required" },
      { status: 400 }
    );
  }

  try {
    const assessment = await createAssessment({
      courseCode,
      title,
      type,
      dueAt,
      studentId,
      reminders,
    });
    return NextResponse.json(assessment, { status: 201 });
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
    await deleteAssessment(id);
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
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body = await request.json();
  try {
    await updateAssessment(id, body);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}