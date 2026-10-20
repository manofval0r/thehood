import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AttendanceGrid, type GridDate } from "@/components/AttendanceGrid";
import { currentStaff } from "@/lib/admin-session";
import {
  getMarks,
  getRoster,
  getStanding,
  isConfigured,
} from "@/lib/attendance-db";
import { COURSES } from "@/lib/resources";
import { SCHEDULE } from "@/lib/schedule";
import {
  addDays,
  classesInWeek,
  longDate,
  startOfWeek,
  todayIso,
} from "@/lib/session-dates";

export const metadata: Metadata = {
  title: "Mark attendance · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/** The days a course meets, including any second meeting in the week. */
function meetingDays(courseCode: string): number[] {
  return SCHEDULE.filter((s) => s.code === courseCode).map((s) => s.dayIndex);
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Staff
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Mark attendance
        </h1>
      </header>

      <Suspense fallback={<GridSkeleton />}>
        <Workspace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-hidden="true">
      <div className="h-4 w-56 animate-pulse rounded bg-surface-raised" />
      <div className="h-72 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function Workspace({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();

  if (!(await currentStaff())) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          This area is for staff
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Sign in on the{" "}
          <Link href="/admin" className="text-accent underline underline-offset-4">
            staff page
          </Link>{" "}
          to mark attendance.
        </p>
      </div>
    );
  }

  if (!isConfigured()) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          The attendance store is not configured
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and this grid will
          fill in.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const requested = typeof params.course === "string" ? params.course : "";
  const course =
    COURSES.find((c) => c.code === requested) ??
    COURSES.find((c) => c.code === "CSC 305") ??
    COURSES[0];

  const today = todayIso();
  const requestedWeek = typeof params.week === "string" ? params.week : "";
  const weekStart = startOfWeek(requestedWeek || today);
  const days = meetingDays(course.code);
  const dates: GridDate[] = classesInWeek(weekStart, days);

  const [roster, marks, standing] = await Promise.all([
    getRoster(course.code),
    getMarks(
      course.code,
      dates.map((d) => d.iso)
    ),
    getStanding(course.code),
  ]);

  const initial: Record<string, { fill: number | null; excused: boolean }> = {};
  for (const d of dates) {
    for (const student of roster) {
      const mark = marks.get(`${d.iso}|${student.matric}`);
      initial[`${d.iso}|${student.matric}`] = mark
        ? { fill: mark.fill, excused: mark.excused }
        : { fill: null, excused: false };
    }
  }

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const courseQuery = `course=${encodeURIComponent(course.code)}`;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] text-muted">{course.code}</p>
          <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-foreground">
            {course.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {course.day} {course.time} · {course.venue} · {course.lecturer}
          </p>
        </div>

        <nav className="flex items-center gap-2 text-[12.5px]">
          <Link
            href={`/admin/attendance?${courseQuery}&week=${prevWeek}`}
            className="pressable rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Previous week
          </Link>
          <Link
            href={`/admin/attendance?${courseQuery}&week=${today}`}
            className="pressable rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
          >
            This week
          </Link>
          <Link
            href={`/admin/attendance?${courseQuery}&week=${nextWeek}`}
            className="pressable rounded-md border border-border px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Next week
          </Link>
        </nav>
      </div>

      <p className="mt-2 text-[12.5px] text-muted">
        Week of {longDate(weekStart)}
        {dates.length === 0
          ? " · this course does not meet in this week"
          : ` · ${dates.length} ${dates.length === 1 ? "class" : "classes"}`}
      </p>

      <nav className="mt-5 flex flex-wrap gap-2">
        {COURSES.map((c) => (
          <Link
            key={c.slug}
            href={`/admin/attendance?course=${encodeURIComponent(c.code)}&week=${weekStart}`}
            className={
              "pressable rounded-full border px-3 py-1 text-[12px] font-medium " +
              (c.code === course.code
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c.code}
          </Link>
        ))}
      </nav>

      {roster.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h3 className="text-[15px] font-semibold text-foreground">
            Nobody is on the roll for {course.code} yet
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Add the students on the{" "}
            <Link href="/admin" className="text-accent underline underline-offset-4">
              staff page
            </Link>{" "}
            and they will appear here as one box each.
          </p>
        </div>
      ) : dates.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h3 className="text-[15px] font-semibold text-foreground">
            No class this week
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            {course.code} meets on {course.day}, so there is nothing to mark in
            this week. Move to another week.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <AttendanceGrid
            course={course.code}
            courseTitle={course.title}
            students={roster.map((s) => ({ matric: s.matric, name: s.name }))}
            dates={dates}
            initial={initial}
            standing={standing}
          />
          <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-muted">
            An empty box has not been marked yet and does not count against
            anyone. A crossed box is an absence. A flat bar is an excuse, and
            excuses are left out of the percentage. A student is usually
            expected to reach 70 percent of the classes that were marked.
          </p>
        </div>
      )}
    </div>
  );
}
