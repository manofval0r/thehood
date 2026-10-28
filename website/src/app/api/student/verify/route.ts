import { NextResponse } from "next/server";
import {
  startStudentSession,
  verifyRosterIdentity,
} from "@/lib/student-session";
import { studentVerificationThrottle } from "@/lib/student-verification";

const GENERIC_ERROR = "Those details do not match the student roll.";

function requestKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const key = requestKey(request);
  if (studentVerificationThrottle.isBlocked(key)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Wait fifteen minutes and try again." },
      { status: 429 }
    );
  }

  let body: { matric?: unknown; surname?: unknown };
  try {
    body = (await request.json()) as { matric?: unknown; surname?: unknown };
  } catch {
    studentVerificationThrottle.recordFailure(key);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const matric = typeof body.matric === "string" ? body.matric : "";
  const surname = typeof body.surname === "string" ? body.surname : "";
  let student = null;
  try {
    student = await verifyRosterIdentity(matric, surname);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Verification is unavailable right now." },
      { status: 503 }
    );
  }

  if (!student) {
    studentVerificationThrottle.recordFailure(key);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  studentVerificationThrottle.clear(key);
  await startStudentSession(student);
  return NextResponse.json({
    ok: true,
    student: { matric: student.matric, name: student.name },
  });
}
