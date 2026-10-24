"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/admin/settings/notifications",
    label: "Notifications",
    superOnly: true,
  },
  {
    href: "/admin/settings/breaks",
    label: "Session breaks",
    superOnly: false,
  },
] as const;

/**
 * The sections of the settings area.
 *
 * Notifications are a super admin's to change; breaks are part of running a
 * session and belong to any member of staff. A tab that cannot be used is not
 * shown rather than shown disabled, because a lock with no key is noise.
 */
export default function SettingsTabs({
  showNotifications,
}: {
  showNotifications: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="mt-8 flex gap-1 overflow-x-auto border-b border-border"
    >
      {TABS.filter((tab) => showNotifications || !tab.superOnly).map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable -mb-px inline-flex shrink-0 items-center border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors max-sm:min-h-11 max-sm:px-4",
              active
                ? "border-accent font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
