import { connection } from "next/server";
import { getBulletinMeeting } from "@/lib/bulletin";
import { currentStudent } from "@/lib/student-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connection();
  const student = await currentStudent();
  if (!student) {
    return Response.json({ error: "Student verification required." }, { status: 401 });
  }

  const { id } = await context.params;
  const meeting = await getBulletinMeeting(id);
  if (!meeting) {
    return Response.json({ error: "No active meeting link is available." }, { status: 404 });
  }
  return Response.json(meeting);
}
