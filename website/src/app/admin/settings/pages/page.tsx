import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import PageSwitches, { type PagesScopeRow } from "@/components/PageSwitches";
import SettingsTabs from "@/components/SettingsTabs";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import { getDisabledPages, PUBLIC_PAGES, ADMIN_PAGES } from "@/lib/pages-settings";

export const metadata = {
  title: "Pages this site shows · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/** The public and staff pages, with their current hidden state. */
export default function AdminSettingsPagesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        eyebrow="Settings"
        title="Pages this site shows"
        lede="Everything the public sees and everything staff see. A page turned off is not deleted; the navigation stops naming it, and a direct visit to its address answers with a redirect."
      />
      <Suspense
        fallback={
          <div className="mt-10 h-64 animate-pulse rounded-lg border border-border" />
        }
      >
        <Section />
      </Suspense>
    </div>
  );
}

async function Section() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!isSuper(me)) {
    return (
      <>
        <SettingsTabs showNotifications={false} superRole={false} />
        <div className="mt-10 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-foreground">
            Only a super admin can put pages away
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            You can sign in, but turning pages on or off for the whole site is not one of
            the things an admin may do.
          </p>
        </div>
      </>
    );
  }

  const publicDisabled = await getDisabledPages("public");
  const adminDisabled = await getDisabledPages("admin");

  const publicRows: PagesScopeRow[] = PUBLIC_PAGES.map((p) => ({
    path: p.path,
    label: p.label,
    off: publicDisabled.includes(p.path),
  }));
  const adminRows: PagesScopeRow[] = ADMIN_PAGES.map((p) => ({
    path: p.path,
    label: p.label,
    off: adminDisabled.includes(p.path),
  }));

  return (
    <>
      <SettingsTabs showNotifications={true} superRole={true} />
      <PageSwitches publicRows={publicRows} adminRows={adminRows} />
    </>
  );
}
