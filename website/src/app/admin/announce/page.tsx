import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import AnnouncementComposer from "@/components/AnnouncementComposer";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import { classContexts, listAnnouncements } from "@/lib/announcements";
import { COURSES } from "@/lib/resources";

export const metadata = {
  title: "Say something · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * Say something to the students.
 *
 * The message that matters is the one a student would otherwise find out by
 * turning up: the class is not running, it is in another room, it starts
 * at a different time. It goes to the phone in their pocket, and to the
 * bell on the site for whoever is looking at it now.
 *
 * Only a super admin. This is the one thing on the site that speaks to
 * everybody at once, and a message said at the wrong moment is not a
 * mistake an ordinary admin should be able to make.
 */
export default async function AdminAnnouncePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Say something"
        lede="A message to everybody who has their notifications on. The one everybody sends is that a class is not running, and it has to reach the student who has the site closed and the phone face down."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <AnnounceArea />
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

async function AnnounceArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!isSuper(me)) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Only a super admin can send a message to everybody
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but a message that goes to every student is not one
          of the things an admin may do. A super admin can make it so.
        </p>
      </div>
    );
  }

  const [history, contexts] = await Promise.all([
    listAnnouncements(25),
    Promise.resolve(classContexts()),
  ]);

  return (
    <AnnouncementComposer
      contexts={contexts}
      history={history}
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
