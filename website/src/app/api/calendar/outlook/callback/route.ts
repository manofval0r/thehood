import { NextResponse } from "next/server";

/**
 * Microsoft Outlook OAuth callback endpoint.
 *
 * Microsoft redirects here after the user approves (or denies) access, and
 * the authorization code is exchanged for tokens. The tokens are not stored
 * yet: /timetable subscribes to the site's own .ics feed instead, and this
 * route is the scaffolding for the two-way sync that comes later.
 *
 * The redirect URI is taken from the request so that it matches the one the
 * authorize step sent exactly, including the host the reader is actually on.
 *
 * Requires OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables.
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

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/calendar/outlook/callback`;

  if (!clientId || !clientSecret) {
    return back({ calendarError: "not_configured" });
  }

  try {
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!tokenResponse.ok) {
      return back({ calendarError: "token_exchange_failed" });
    }

    // TODO: store the refresh token against this device once the sync job
    // exists. Until then the exchange only proves the credentials are right.
    await tokenResponse.json().catch(() => null);

    return back({ calendarConnected: "outlook" });
  } catch {
    return back({ calendarError: "token_exchange_failed" });
  }
}
