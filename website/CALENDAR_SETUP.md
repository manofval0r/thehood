# Calendar setup

This is how the timetable gets into a reader's own calendar. There are two
layers, and only the first one needs anything explained to a student.

1. **Subscribe to the feed.** Works today, on every deployment, with no
   credentials and no sign-in. This is what the buttons on `/timetable` do.
2. **Two-way sync through OAuth.** Optional, not used by the buttons yet, and
   only worth setting up if you want the site to write events into calendars
   rather than read from them. The routes exist and are documented below.

---

## 1. The feed, which is what ships

The site publishes a public iCalendar file at:

```
https://nutmcybersecurity.vercel.app/timetable.ics
```

Every lecture, with its venue, its time and its breaks, is in that one file.
Google Calendar and Outlook Calendar can both subscribe to a URL like that and
refresh it themselves. Nothing about a reader's calendar reaches this site.

If `NEXT_PUBLIC_SITE_URL` is set on the deployment, the timetable page builds
its links from it. If it is not set, the page falls back to
`https://nutmcybersecurity.vercel.app`. Set it in Vercel:

| Key | Value | Environments |
|-----|-------|--------------|
| `NEXT_PUBLIC_SITE_URL` | `https://nutmcybersecurity.vercel.app` | Production |

`NEXT_PUBLIC_` variables are baked into the build, so redeploy after changing
it.

### What the reader does

**Google Calendar.** Press **Add to Google Calendar** on `/timetable`. Google
opens with the feed URL filled in and asks whether to add it. Accept, and it
appears under "Other calendars". Google refreshes it on its own schedule.

The link the button uses is:

```
https://calendar.google.com/calendar/r?cid=<encoded timetable.ics URL>
```

**Outlook Calendar.** Press **Add to Outlook Calendar**. Outlook opens the
"Add a calendar from the web" dialog with the URL and a name already filled
in. Accept, and it appears in the calendar list.

```
https://outlook.live.com/calendar/0/addfromweb?url=<encoded feed>&name=Cybersecurity%20300L%20timetable
```

Work or school accounts can use `https://outlook.office.com/calendar/0/addfromweb`
in place of `outlook.live.com`.

**A downloaded file.** Press **Download .ics** and open the file. Google and
Outlook both import it, but an import is a copy: later changes to the
timetable do not follow. The feed is the better option for a student who
wants it to stay current.

### How the feed is built

- `src/app/timetable.ics/route.ts` turns the timetable and the break settings
  into iCalendar.
- Breaks live in the database (`session_breaks`), so changing one changes the
  feed without a redeploy.

### Checking it

```bash
curl -I https://nutmcybersecurity.vercel.app/timetable.ics
```

A `200` and `Content-Type: text/calendar` is the whole test. If it is a `404`,
the deployment is older than the feed route. If it is a `500`, the database is
not reachable; check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` first.

---

## 2. Optional OAuth two-way sync

The site has the first half of an OAuth flow:

- `GET /api/calendar/google/authorize` and `/api/calendar/outlook/authorize`
  send the reader to the provider.
- `GET /api/calendar/google/callback` and `/api/calendar/outlook/callback`
  exchange the code for tokens.

The callback currently proves the credentials work and then redirects back to
`/timetable`. It does **not** store the refresh token, so it does not sync
anything yet. The buttons on `/timetable` deliberately do not use these
routes: a button that needs a secret nobody has set is a button that does
nothing, and the feed already does what a reader needs.

Add the credentials below only when the token store and the sync job exist.

### Redirect URIs

Both callbacks derive their redirect URI from the request's own origin, so the
URI you register has to be the origin the reader is actually on:

```
https://nutmcybersecurity.vercel.app/api/calendar/google/callback
https://nutmcybersecurity.vercel.app/api/calendar/outlook/callback
```

Preview deployments have a different hostname, so they need their own entry if
you want to test there. Add every host you use, with no trailing slash.

### Google Calendar credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and
   create (or choose) a project.
2. **APIs & Services → Library**, search for **Google Calendar API**, enable
   it.
3. **APIs & Services → OAuth consent screen**, choose **External**, fill in
   the app name and support email, and add the scope
   `https://www.googleapis.com/auth/calendar.events`. While the app is in
   "Testing", add every account that will connect as a test user.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   Choose **Web application**.
5. Under **Authorized redirect URIs**, add the Google callback URL above.
6. Create it and copy the **Client ID** and **Client secret**.
7. In Vercel, **Project → Settings → Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `GOOGLE_CLIENT_ID` | the client ID |
   | `GOOGLE_CLIENT_SECRET` | the client secret |

8. Redeploy so the functions pick the variables up.

### Outlook Calendar credentials

1. Open the [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID**
   → **App registrations** → **New registration**.
2. Name it, and choose **Accounts in any organizational directory and personal
   Microsoft accounts** if students use both kinds of account.
3. Under **Authentication → Add a platform → Web**, add the Outlook callback
   URL above.
4. Under **Certificates & secrets → New client secret**, create one and copy
   the value immediately. It is not shown again.
5. In Vercel, add:

   | Key | Value |
   |-----|-------|
   | `OUTLOOK_CLIENT_ID` | the Application (client) ID |
   | `OUTLOOK_CLIENT_SECRET` | the client secret value |

6. Redeploy.

### When the sync job exists

The callback will need to write a row per device: the provider, the refresh
token (encrypted at rest, never returned to a client), and the calendar id the
reader chose. The sync job then reads the same timetable the feed is built
from, so the two never disagree.

---

## Troubleshooting

| Symptom | Cause and fix |
|---------|---------------|
| Google says "Could not find calendar" | The feed URL is not publicly reachable, or `NEXT_PUBLIC_SITE_URL` points at the wrong host. Open the feed URL in a private window. |
| Outlook adds an empty calendar | The feed returned an error when Outlook fetched it. Check `curl -I` on the feed. |
| The feed is a day off for some readers | Events are written in Africa/Lagos with a `VTIMEZONE`, so this usually means a very old calendar client. Re-add the feed. |
| `redirect_uri_mismatch` | The registered URI and the request origin differ. The routes use the request origin, so register the exact host, including `https`. |
| "not_configured" after pressing an OAuth link | `GOOGLE_CLIENT_ID` or `OUTLOOK_CLIENT_ID` is not set on the deployment that served the request. |
| Tokens exchange but nothing syncs | Expected. Token storage and the sync job are not built yet; use the feed. |
