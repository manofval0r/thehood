import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AdminLogin } from "@/components/AdminLogin";
import { FileManager } from "@/components/FileManager";
import { RosterManager } from "@/components/RosterManager";
import { StaffManager } from "@/components/StaffManager";
import { logout } from "@/app/admin/actions";
import { currentStaff } from "@/lib/admin-session";
import {
  getAllSummaries,
  getRoster,
  isConfigured,
} from "@/lib/attendance-db";
import { getAllFiles } from "@/lib/files";
import { listStaff } from "@/lib/staff";
import { COURSES } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Staff area · Cybersecurity 300L",
  description: "Attendance marking for departmental staff.",
  robots: { index: false, follow: false },
};

/**
 * The staff area.
 *
 * Everything here is behind the shared code and everything here is personal
 * data, so the page itself never appears in a search engine and the roster
 * never leaves the server.
 *
 * The read of the session is behind a Suspense boundary on purpose. With
 * Cache Components, reading a cookie outside a boundary is a build error, and
 * the boundary is also what lets the heading above it prerender, so the page
 * paints immediately and the private part arrives a moment later.
 */
export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Staff
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The staff area
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Attendance is marked here and nowhere else. Everyone on the staff
          list has a code of their own, so a mark carries a name and a code can
          be taken back from one person without touching anybody else. Nothing
          on this page is public, and nothing on this page is indexed.
        </p>
      </header>

      <Suspense fallback={<AreaSkeleton />}>
        <AdminArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function AdminArea() {
  await connection();

  const me = await currentStaff();
  if (!me) {
    return <AdminLogin />;
  }

  if (!isConfigured()) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          The attendance store is not configured
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You are signed in, but this deployment has no database behind it.
          Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and the rest of this
          area will fill in.
        </p>
      </div>
    );
  }

  const [roster, summaries, files, staff] = await Promise.all([
    getRoster(),
    getAllSummaries(),
    getAllFiles(),
    listStaff(),
  ]);

  const courseOptions = COURSES.map((c) => ({ code: c.code, title: c.title }));

  return (
    <>
      <section className="mt-10">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Mark attendance
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          One box per class per student. A box nobody has filled in is not an
          absence, and the grid keeps the two apart.
        </p>

        <ul className="mt-4 divide-y divide-border border-y border-border">
          {COURSES.map((c) => {
            const summary = summaries[c.code];
            const onRoll = roster.filter((s) => s.course === c.code).length;
            return (
              <li key={c.slug}>
                <Link
                  href={`/admin/attendance?course=${encodeURIComponent(c.code)}`}
                  className="group flex items-center gap-4 py-3"
                >
                  <span className="w-24 shrink-0 font-mono text-[12px] text-muted">
                    {c.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-foreground group-hover:text-accent">
                      {c.title}
                    </span>
                    <span className="block text-[11.5px] text-muted">
                      {c.day} {c.time} · {c.venue}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[11.5px] text-muted">
                    <span className="block">
                      {onRoll} on the roll
                    </span>
                    <span className="block">
                      {summary ? `${summary.sessions} classes marked` : "no classes marked"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <StaffManager staff={staff} me={me.id} />

      <FileManager
        courses={courseOptions}
        files={files.map((f) => ({
          id: f.id,
          course: f.course,
          title: f.title,
          type: f.type,
          size: f.size,
          source: f.source,
        }))}
      />

      <RosterManager students={roster} courses={courseOptions} />

      <form action={logout} className="mt-12 flex items-center gap-3">
        <p className="text-[12.5px] text-muted">
          Signed in as {me.name}.
        </p>
        <button
          type="submit"
          className="pressable rounded-md border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </>
  );
}
