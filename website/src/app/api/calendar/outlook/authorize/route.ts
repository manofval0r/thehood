import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import { createOutlookState } from "@/lib/outlook-calendar-core";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const back = (error: string) =>
    NextResponse.redirect(
      new URL(`/admin/bulletin?calendarError=${encodeURIComponent(error)}`, origin)
    );

  const staff = await currentStaff();
  if (!staff || !isSuper(staff)) return back("forbidden");

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const secret = process.env.ADMIN_SECRET;
  if (!clientId || !secret) return back("not_configured");

  const redirectUri = `${origin}/api/calendar/outlook/callback`;
  const state = createOutlookState(
    { staffId: staff.id, expiresAt: Date.now() + 10 * 60 * 1000 },
    secret
  );
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "Calendars.Read offline_access User.Read",
    response_mode: "query",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  );
}
