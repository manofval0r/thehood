import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import BreakEditor from "@/components/BreakEditor";
import SettingsTabs from "@/components/SettingsTabs";
import { currentStaff } from "@/lib/admin-session";
import { getAllBreaks } from "@/lib/break-store";
import { isSuper } from "@/lib/staff";

export const metadata = {
  title: "Session breaks · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * The breaks inside the lectures.
 *
 * A three hour lecture is not three hours of teaching. It is an hour, a
 * break, an hour, a break, and the last hour. How long the break is is a
 * decision somebody makes in a room, not a constant in a file, so it is set
 * here and it is per session.
 */
export default async function AdminBreakSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        eyebrow="Settings"
        title="Session breaks"
        lede="A lecture is an hour of teaching, a break, an hour of teaching, and the last hour. The break falls at the end of each hour, and the last hour has none in it, so a three hour lecture with a ten minute break has two breaks and still ends when it was scheduled to end."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <BreaksArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function BreaksArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  const breaks = await getAllBreaks();

  return (
    <>
      <SettingsTabs showNotifications={isSuper(me)} />
      <BreakEditor breaks={breaks} />
    </>
  );
}
