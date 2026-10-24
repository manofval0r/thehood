import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";

/**
 * Settings has no landing page of its own. Notifications are the first thing
 * a super admin can change; everybody else goes to the breaks they can edit.
 *
 * This is a route handler rather than a page with `redirect()` so the browser
 * gets a real 307. A rendered redirect shell would keep the server's dark
 * `data-theme` until the next document, which is wrong for a reader who chose
 * light. The destination loads as a normal document, with the theme already
 * correct.
 */

export async function GET(request: Request) {
  const me = await currentStaff();
  const destination =
    me && isSuper(me)
      ? "/admin/settings/notifications"
      : "/admin/settings/breaks";

  return NextResponse.redirect(new URL(destination, request.url));
}
