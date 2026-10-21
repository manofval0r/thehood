import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/permissions";
import { registerFor } from "@/lib/attendance-db";
import { COURSES } from "@/lib/resources";

/**
 * The register, as a sheet.
 *
 * A lecturer's actual need is a spreadsheet: every student, every class, every
 * mark, in one file they can open. It is behind the staff session, because
 * it is personal data.
 */
export async function GET(request: Request) {
  const staff = await currentStaff();
  if (!staff || !can(staff, "attendance")) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("course") ?? COURSES[0].code;
  const course = COURSES.find((c) => c.code === code) ?? COURSES[0];

  const rows = await registerFor(course.code);

  // One row per student per class, because that is the shape a register has.
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  const byStudent = new Map<string, Map<string, { fill: number | null; excused: boolean }>>();
  for (const row of rows) {
    let sessions = byStudent.get(row.matric);
    if (!sessions) {
      sessions = new Map();
      byStudent.set(row.matric, sessions);
    }
    sessions.set(row.date, { fill: row.fill, excused: row.excused });
  }

  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const lines: string[] = [];
  lines.push(
    [escape(course.code), escape(course.title), escape(`as at ${new Date().toISOString().slice(0, 10)}`)].join(",")
  );
  lines.push("");
  lines.push(
    ["Matric number", "Name", ...dates.map((d) => d)].join(",")
  );

  for (const [matric, sessions] of byStudent) {
    const name = rows.find((r) => r.matric === matric)?.name ?? matric;
    const cells = dates.map((d) => {
      const mark = sessions.get(d);
      if (!mark) return "";
      if (mark.excused) return "excused";
      if (mark.fill === null) return "";
      if (mark.fill <= 0) return "absent";
      if (mark.fill >= 1) return "present";
      return `${Math.round(mark.fill * 100)}%`;
    });
    lines.push([escape(matric), escape(name), ...cells].join(","));
  }

  const csv = lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="register-${course.code
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
