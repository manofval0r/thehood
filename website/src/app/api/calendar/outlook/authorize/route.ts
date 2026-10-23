import { NextResponse } from "next/server";

/**
 * Microsoft Outlook (Microsoft 365) Calendar OAuth authorization endpoint.
 *
 * Redirects the reader to Microsoft's consent screen. The redirect URI is
 * derived from the request so that it matches the callback exactly, on the
 * preview host as well as on production.
 *
 * This is the scaffold for two-way sync. The buttons on /timetable use the
 * public .ics feed instead, so nothing here has to be configured for the
 * calendar to work.
 *
 * Requires OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/calendar/outlook/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/timetable?calendarError=not_configured", origin)
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "Calendars.ReadWrite offline_access",
    response_mode: "query",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}
