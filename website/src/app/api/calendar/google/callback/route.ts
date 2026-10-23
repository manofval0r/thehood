import { NextResponse } from "next/server";

/**
 * Google Calendar OAuth callback endpoint.
 *
 * Google redirects here after the user approves (or denies) access, and the
 * authorization code is exchanged for tokens. The tokens are not stored yet:
 * the timetable's own .ics feed is what the buttons on /timetable use, and
 * this route is the scaffolding for the two-way sync that comes later.
 *
 * The redirect URI is taken from the request rather than from an environment
 * variable, because it has to be byte-for-byte the one the authorize step
 * sent. A trailing slash or a preview hostname that disagrees is the single
 * most common cause of `redirect_uri_mismatch`.
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const back = (params: Record<string, string>) => {
    const target = new URL("/timetable", url.origin);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target);
  };

  if (error || !code) {
    return back({ calendarError: error || "user_denied" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/calendar/google/callback`;

  if (!clientId || !clientSecret) {
    return back({ calendarError: "not_configured" });
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return back({ calendarError: "token_exchange_failed" });
    }

    // TODO: store the refresh token against this device once the sync job
    // exists. Until then the exchange only proves the credentials are right.
    await tokenResponse.json().catch(() => null);

    return back({ calendarConnected: "google" });
  } catch {
    return back({ calendarError: "token_exchange_failed" });
  }
}
