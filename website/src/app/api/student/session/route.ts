import { NextResponse } from "next/server";
import {
  currentStudent,
  endStudentSession,
} from "@/lib/student-session";

export async function GET() {
  const student = await currentStudent();
  return NextResponse.json({
    verified: Boolean(student),
    student: student
      ? { matric: student.matric, name: student.name }
      : null,
  });
}

export async function DELETE() {
  await endStudentSession();
  return new NextResponse(null, { status: 204 });
}
