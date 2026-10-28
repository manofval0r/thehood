import { connection } from "next/server";
import { getBulletinFeed } from "@/lib/bulletin";
import { currentStudent } from "@/lib/student-session";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const archive = url.searchParams.get("archive") === "1";
  const student = await currentStudent();
  const feed = await getBulletinFeed({ archive, student });
  return Response.json(feed);
}
