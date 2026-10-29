import { connection } from "next/server";
import {
  getBulletinRsvpSummary,
  upsertBulletinRsvp,
} from "@/lib/bulletin";
import { currentStudent } from "@/lib/student-session";
import type { RsvpResponse } from "@/lib/bulletin-types";

const RESPONSES: RsvpResponse[] = ["going", "unsure", "not_going"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await context.params;
  const student = await currentStudent();
  return Response.json(
    await getBulletinRsvpSummary(id, student?.matric ?? null)
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connection();
  const student = await currentStudent();
  if (!student) {
    return Response.json({ error: "Student verification required." }, { status: 401 });
  }

  let response: string;
  try {
    response = String(((await request.json()) as { response?: unknown }).response ?? "");
  } catch {
    return Response.json({ error: "Choose a response." }, { status: 400 });
  }
  if (!RESPONSES.includes(response as RsvpResponse)) {
    return Response.json({ error: "Choose a valid response." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    await upsertBulletinRsvp(id, student.matric, response as RsvpResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The response could not be saved." },
      { status: 409 }
    );
  }
  return Response.json(await getBulletinRsvpSummary(id, student.matric));
}
