import { Suspense } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import { RosterManager } from "@/components/RosterManager";
import { currentStaff } from "@/lib/admin-session";
import { getRoster } from "@/lib/attendance-db";
import { can } from "@/lib/staff";
import { COURSES } from "@/lib/resources";

export const metadata = {
  title: "The roll · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * The roll.
 *
 * The students on each course. The cohort is already in the database; this
 * is where somebody is added or taken off.
 */
export default async function AdminRollPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="The roll"
        lede="Who is on each course. Paste the students as one matric number and name per line, and the roll is kept in one place for the whole programme."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <RollArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="h-56 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function RollArea() {
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!can(me, "roster")) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Keeping the roll is not one of your permissions
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but you have not been allowed to change who is on
          the roll. A super admin can turn it on from the staff page.
        </p>
      </div>
    );
  }

  const roster = await getRoster();

  return (
    <RosterManager
      students={roster}
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
