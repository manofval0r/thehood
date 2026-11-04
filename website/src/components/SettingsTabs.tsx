"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/settings", label: "Overview", superOnly: false },
  { href: "/admin/settings/pages", label: "Pages", superOnly: true },
  { href: "/admin/settings/notifications", label: "Notifications", superOnly: true },
  { href: "/admin/settings/breaks", label: "Session breaks", superOnly: false },
] as const;

/**
 * The settings hub tabs.
 *
 * Each tab is a section of the settings area. A tab that cannot be used is
 * not shown rather than shown disabled. Attendance and Roll are linked from
 * the overview rather than given tabs here, because they are working pages,
 * not configuration of the app.
 */
export default function SettingsTabs({
  showNotifications,
  superRole = false,
}: {
  showNotifications: boolean;
  superRole?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="mt-10">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground max-sm:min-h-11"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        Settings
      </Link>

      <div
        className="mt-3 flex h-11 items-center gap-0.5 overflow-x-auto border-b border-border scroll-none"
      >
        {TABS.filter((tab) => !tab.superOnly || showNotifications || superRole).map(
          (tab) => {
            const active =
              pathname === tab.href ||
              (tab.href !== "/admin/settings" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable relative inline-flex h-full shrink-0 items-center px-4 text-[12.5px] font-medium transition-colors",
                  active
                    ? "text-foreground font-semibold after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}
