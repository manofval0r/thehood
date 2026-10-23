/**
 * Google Calendar OAuth authorization endpoint.
 *
 * Redirects the user to Google's OAuth consent screen so they can grant
 * the site permission to read and write their Google Calendar. After the
 * user approves, Google redirects back to /api/calendar/google/callback.
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/google/callback`;

  if (!clientId) {
    return Response.json(
      { error: "Google Calendar integration not configured. Set GOOGLE_CLIENT_ID." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
