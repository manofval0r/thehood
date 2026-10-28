import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import BulletinManager from "@/components/BulletinManager";
import { currentStaff } from "@/lib/admin-session";
import { getBulletinAdminData } from "@/lib/bulletin-admin";
import { COURSES } from "@/lib/resources";

export const metadata = {
  title: "Campus bulletin · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

export default function AdminBulletinPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Campus bulletin"
        lede="Draft and publish the cohort's operational truth. Outlook is the source until a super admin records a one-class override, with the conflict and notification consequences shown before it goes live."
      />
      <Suspense fallback={<Skeleton />}>
        <Workspace />
      </Suspense>
    </div>
  );
}

function Skeleton() {
  return <div className="mt-10 h-72 animate-pulse rounded-xl border border-border bg-surface" />;
}

async function Workspace() {
  await connection();
  const me = await currentStaff();
  if (!me) return <AdminLogin />;
  const data = await getBulletinAdminData();
  return (
    <BulletinManager
      me={{ id: me.id, name: me.name, role: me.role }}
      courses={COURSES.map((course) => ({ code: course.code, title: course.title }))}
      {...data}
    />
  );
}
