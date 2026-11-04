import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import SettingsTabs from "@/components/SettingsTabs";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";

export const metadata = {
  title: "Settings · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

const SECTIONS: {
  title: string;
  blurb: string;
  href: string;
  superOnly?: boolean;
}[] = [
  {
    title: "Pages this site shows",
    blurb: "Which public and staff routes are offered anywhere on the site.",
    href: "/admin/settings/pages",
    superOnly: true,
  },
  {
    title: "Notifications",
    blurb: "Which notifications the site is allowed to send, and a test send.",
    href: "/admin/settings/notifications",
    superOnly: true,
  },
  {
    title: "Session breaks",
    blurb: "The short and long breaks inside a lecture, which the timetable and countdown read.",
    href: "/admin/settings/breaks",
  },
  {
    title: "Attendance",
    blurb: "Mark and review the attendance sheets for your courses.",
    href: "/admin/attendance",
  },
  {
    title: "Roll",
    blurb: "The registered student roster for each course.",
    href: "/admin/roll",
  },
];

/**
 * The settings area.
 *
 * It is a list, not a duplication of every page: each section points at its
 * own address with one line about what it does. The two flips that follow
 * are the only things on this page proper — the list names the sections.
 *
 * Hidden from everyone who is not allowed to see a section, so nobody is
 * shown a link they cannot use.
 */
export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20 settings-enter">
      <AdminHeader
        eyebrow="Settings"
        title="Settings"
        lede="The things about this site that are usually changed rarely and deliberately. Each section below links to its own page."
      />
      <Suspense fallback={<div className="mt-10 h-64 animate-pulse rounded-lg border border-border bg-surface" />}>
        <Sections />
      </Suspense>
    </div>
  );
}

async function Sections() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  const superRole = isSuper(me);
  const visible = SECTIONS.filter((s) => !s.superOnly || superRole);

  return (
    <>
      <SettingsTabs showNotifications superRole={superRole} />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {visible.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group pressable rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-foreground">
                  {section.title}
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                  {section.blurb}
                </span>
              </span>
              <ChevronRight
                size={18}
                className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
