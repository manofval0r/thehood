import { redirect } from "next/navigation";
import { connection } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";

/**
 * The destination depends on who is signed in, so this route cannot be
 * prerendered. It is a redirect, not a page, and waiting for the session is
 * the point.
 */
export const instant = false;

/**
 * Settings has no landing page of its own. Notifications are the first thing
 * a super admin can change; everybody else goes to the breaks they can edit.
 */
export default async function AdminSettingsPage() {
  await connection();
  const me = await currentStaff();

  redirect(
    me && isSuper(me)
      ? "/admin/settings/notifications"
      : "/admin/settings/breaks"
  );
}
