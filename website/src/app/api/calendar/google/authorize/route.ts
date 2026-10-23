import { NextResponse } from "next/server";

/**
 * Google Calendar OAuth authorization endpoint.
 *
 * Redirects the reader to Google's consent screen. The redirect URI is
 * derived from the request so that it matches the callback exactly, on the
 * preview host as well as on production.
 *
 * This is the scaffold for two-way sync. The buttons on /timetable use the
 * public .ics feed instead, so nothing here has to be configured for the
 * calendar to work.
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/calendar/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/timetable?calendarError=not_configured", origin)
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
