/**
 * Microsoft Outlook (Microsoft 365) Calendar OAuth authorization endpoint.
 *
 * Redirects the user to Microsoft's consent screen so they can grant the
 * site permission to read and write their Outlook calendar. After the user
 * approves, Microsoft redirects back to /api/calendar/outlook/callback.
 *
 * Requires OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables.
 */
export async function GET(request: Request) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/outlook/callback`;

  if (!clientId) {
    return Response.json(
      { error: "Outlook Calendar integration not configured. Set OUTLOOK_CLIENT_ID." },
      { status: 500 }
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

  return Response.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}
