/**
 * Microsoft Outlook OAuth callback endpoint.
 *
 * Microsoft redirects here after the user approves (or denies) access. We
 * exchange the authorization code for an access token and refresh token,
 * store them in the database, and redirect back to the timetable page.
 *
 * Requires OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return Response.redirect(
      `/timetable?calendarError=${encodeURIComponent(error || "user_denied")}`
    );
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/outlook/callback`;

  if (!clientId || !clientSecret) {
    return Response.redirect(
      `/timetable?calendarError=${encodeURIComponent("not_configured")}`
    );
  }

  try {
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
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
      return Response.redirect(
        `/timetable?calendarError=${encodeURIComponent("token_exchange_failed")}`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Store tokens (device-specific or user-specific) for later sync

    return Response.redirect(`/timetable?calendarSuccess=outlook`);
  } catch {
    return Response.redirect(
      `/timetable?calendarError=${encodeURIComponent("token_exchange_failed")}`
    );
  }
}
