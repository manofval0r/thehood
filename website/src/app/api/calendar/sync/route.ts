/**
 * Calendar sync endpoint.
 *
 * This is the second half of the OAuth flow, and it is not built yet. Tokens
 * are not stored by the callbacks, so there is nothing to sync with, and a
 * route that pretended otherwise would return a success it did not earn.
 *
 * The feed at /timetable.ics is what readers actually subscribe to. Keep this
 * endpoint honest until the token store and the sync job exist.
 */
export async function POST() {
  return Response.json(
    {
      error:
        "Two-way sync is not available yet. Subscribe to /timetable.ics instead.",
    },
    { status: 501 }
  );
}
