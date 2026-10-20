import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";

/**
 * Who is signed in, for the navigation.
 *
 * The navigation bar has to change when a member of staff signs in: the
 * links a student needs are not the links a member of staff needs, and
 * nobody should have to open a back office to do the day's work.
 *
 * This is a small probe rather than a prop, because the bar is rendered in
 * the layout, and reading the session there would make every page of the
 * site wait for a request. The bar asks, once, and the answer is the same
 * for the whole visit.
 */
export async function GET() {
  const staff = await currentStaff();

  if (!staff) {
    return NextResponse.json(
      { isAdmin: false },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  return NextResponse.json(
    {
      isAdmin: true,
      name: staff.name,
      role: staff.role,
      permissions: staff.permissions,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
