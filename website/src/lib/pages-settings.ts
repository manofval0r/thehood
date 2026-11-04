import "server-only";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { rest } from "@/lib/rest";

/**
 * Which pages the site shows anybody at all.
 *
 * A super admin can turn a page off for everyone using the app — the nav
 * stops naming it, and a direct visit to its address answers with a
 * redirect. This is for pages that are not wrong, just not ready: a beta
 * page, or an old page being retired while it still needs to keep working.
 *
 * Two scopes: the public route and the staff area. Each is a list of
 * routes, and the only ones written down are the ones that are off, so a
 * page added to the code later starts on — a page nobody has looked at yet
 * should not be hidden by a stale list.
 */

const KEY_PUBLIC = "pages_off_public";
const KEY_ADMIN = "pages_off_admin";

export const PUBLIC_PAGES: readonly { path: string; label: string }[] = [
  { path: "/", label: "All courses" },
  { path: "/timetable", label: "Timetable" },
  { path: "/assessments", label: "Assessments" },
  { path: "/registration", label: "Registration" },
  { path: "/tools", label: "Tools" },
  { path: "/resources", label: "Resources" },
  { path: "/bulletin", label: "Bulletin" },
  { path: "/timeline", label: "Calendar" },
  { path: "/events", label: "Events" },
  { path: "/careers", label: "Careers" },
  { path: "/contact", label: "Contact" },
];

export const ADMIN_PAGES: readonly { path: string; label: string }[] = [
  { path: "/admin/resources", label: "Resources" },
  { path: "/admin/announce", label: "Announce" },
  { path: "/admin/bulletin", label: "Bulletin" },
  { path: "/admin/attendance", label: "Attendance" },
  { path: "/admin/roll", label: "Roll" },
  { path: "/admin/videos", label: "Videos" },
  { path: "/admin/files", label: "Files" },
  { path: "/admin/notifications", label: "Notifications" },
  { path: "/admin/schedule", label: "Schedule" },
  { path: "/admin/settings/notifications", label: "Notification settings" },
  { path: "/admin/settings/breaks", label: "Session breaks" },
  { path: "/admin", label: "Staff" },
];

export type PageScope = "public" | "admin";

function keyFor(scope: PageScope): string {
  return scope === "public" ? KEY_PUBLIC : KEY_ADMIN;
}

/** The routes that are off, for everyone. */
export async function getDisabledPages(scope: PageScope): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(scope === "public" ? "pages-off-public" : "pages-off-admin");

  const key = keyFor(scope);
  try {
    const rows = await rest<{ value: string }[]>(
      `app_config?key=eq.${encodeURIComponent(key)}&select=value`
    );
    const raw = rows?.[0]?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    const valid = scope === "public" ? PUBLIC_PAGES : ADMIN_PAGES;
    return parsed.filter((path) => valid.some((p) => p.path === path));
  } catch {
    // A settings row that cannot be read is a settings row that is not
    // there, which means nothing is switched off.
    return [];
  }
}

/** Whether a route is offered anywhere on the site. */
export async function pageIsEnabled(
  scope: PageScope,
  path: string
): Promise<boolean> {
  const disabled = await getDisabledPages(scope);
  return !disabled.includes(path);
}

/** Turn a page on or off, for everyone. */
export async function setPageEnabled(
  scope: PageScope,
  path: string,
  enabled: boolean
): Promise<void> {
  const disabled = new Set(await getDisabledPages(scope));

  if (enabled) disabled.delete(path);
  else disabled.add(path);

  await rest("app_config?on_conflict=key", {
    method: "POST",
    body: {
      key: keyFor(scope),
      value: JSON.stringify([...disabled]),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  updateTag(scope === "public" ? "pages-off-public" : "pages-off-admin");
}
