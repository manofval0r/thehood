import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import NotificationCatalogue from "@/components/NotificationCatalogue";
import NotificationKindSwitches from "@/components/NotificationKindSwitches";
import SettingsTabs from "@/components/SettingsTabs";
import { currentStaff } from "@/lib/admin-session";
import { getDisabledKinds } from "@/lib/notification-settings";
import { isSuper } from "@/lib/staff";

export const metadata = {
  title: "Notification settings · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * What can be told about.
 *
 * The bell's settings say what a reader can turn on. This is the other half:
 * everything the site is able to say, in one place, with a button to send each
 * one to this device so somebody can see what it looks like before a hundred
 * people get it.
 *
 * Only a super admin. The list is harmless, but the buttons are not: a test
 * that goes to everybody is not a test.
 */
export default async function AdminNotificationSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        eyebrow="Settings"
        title="Notifications"
        lede="Everything this site can send, and what each one is for. A push is the only way to reach somebody who is not looking at the site, so every kind can be sent to this device to see what it looks like first."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <CatalogueArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function CatalogueArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!isSuper(me)) {
    return (
      <>
        <SettingsTabs showNotifications={false} />
        <div className="mt-10 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-foreground">
            Only a super admin can send a test to everybody&apos;s phone
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            You can sign in, but a test that goes to every student is not one
            of the things an admin may do. The session breaks are still yours
            to change.
          </p>
        </div>
      </>
    );
  }

  const disabled = await getDisabledKinds();

  return (
    <>
      <SettingsTabs showNotifications />
      <NotificationCatalogue disabledKinds={disabled} />
      <NotificationKindSwitches disabled={disabled} />
    </>
  );
}
