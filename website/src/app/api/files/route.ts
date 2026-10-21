import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/permissions";
import { getAllFiles } from "@/lib/files";

/**
 * The file index.
 *
 * The staff area reads it after an upload or a removal, so the list on the
 * page is the list the database holds rather than the list the page was
 * rendered with.
 */
export async function GET() {
  const staff = await currentStaff();
  if (!staff || !can(staff, "files")) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const files = await getAllFiles();

  return NextResponse.json(
    files.map((f) => ({
      id: f.id,
      course: f.course,
      title: f.title,
      type: f.type,
      size: f.size,
      source: f.source,
    })),
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
