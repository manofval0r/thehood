import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import { StaffManager } from "@/components/StaffManager";
import TestNotification from "@/components/TestNotification";
import { currentStaff } from "@/lib/admin-session";
import { can, isSuper, listAudit, listPending, listStaff } from "@/lib/staff";

export const metadata = {
  title: "Who can get in · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * Who can get in.
 *
 * The staff list, the review queue and the audit log. A super admin sees all
 * three; an admin sees the people they added.
 */
export default async function AdminStaffPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Who can get in"
        lede="Everyone with access, and everyone waiting for it. A mark says who made it, and a code can be taken back from one person without touching anybody else."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <StaffArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function StaffArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!can(me, "staff")) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Adding staff is not one of your permissions
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but you have not been allowed to add people. A super
          admin can turn it on from this page.
        </p>
      </div>
    );
  }

  const superUser = isSuper(me);
  const [everyone, pending, audit] = await Promise.all([
    listStaff(),
    superUser ? listPending() : Promise.resolve([]),
    superUser ? listAudit(50) : Promise.resolve([]),
  ]);

  // A super admin sees everybody. An admin sees the people they added.
  const people = superUser
    ? everyone
    : everyone.filter((p) => p.added_by === me.id);

  return (
    <>
      <StaffManager
        me={{ id: me.id, name: me.name, role: me.role }}
        people={people}
        pending={pending}
        audit={audit}
        super={superUser}
      />

      {/* Only a super admin, because a test notification is a thing you do
          when you are checking that the whole chain works. */}
      {superUser && <TestNotification />}
    </>
  );
}
