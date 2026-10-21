# How a student proves who they are

**Research question.** A student wants to see their own attendance. They have
no account. How do we know the person asking is the student whose record it
is, and what open source can help?

**Method.** Breadth 4, depth 2. Web search was unavailable for every query
during this session, so the sources below were fetched directly rather than
discovered. Findings were checked against the live database and the live
code, not only against the literature.

---

## The short answer

**The matric number is a lookup key, never the proof.**

The whole 300L year group sits between `2423131001` and `2423131019`. That
is 19 numbers for 17 students, and the two gaps (`...014`, `...017`) are
known gaps. Every surname in the roster is distinct, so matric plus surname
is 17 by 17, about 289 combinations, all of them guessable without a phone
book. Any sign-in where the matric number is the secret is broken on the day
it ships.

**And the site cannot send a student a one-time code, because it has nowhere
to send it.** The roster table holds exactly three columns: `matric`,
`name`, `course`. There is no email address and no phone number for any of
the 17 students. A one-time code is the right second factor and it is not
available, because the second factor has to reach a channel the database
cannot currently name.

That leaves one honest place to get the second factor: **the department
issues it.** The site already does this for staff, and it works.

---

## What the sources say

### NIST SP 800-63B-4, Digital Identity Guidelines

The current revision. SP 800-63-3 was superseded on 1 August 2025.

- **AAL1** is single factor. **AAL2** requires two distinct factors, and
  must offer a phishing-resistant option. **AAL3** requires a cryptographic
  key in a non-exportable authenticator.
- The permitted authenticator list at AAL1 includes **password**, **look-up
  secret** (something you have: a printed card, a saved recovery code) and
  **out-of-band device** (something you have, reached on a separate
  channel: a phone receiving a code). Both are "something you have", and
  both fit a student better than a password does.
- A **biometric characteristic is not an authenticator by itself.** This
  rules out the tempting option of face or fingerprint matching without a
  device authenticator in front of it.
- Passwords used alone must be **15 characters minimum**, checked against a
  blocklist, **rate limited**, and salted and hashed with an approved scheme.
- Where a service collects personal information to issue authenticators,
  NIST expects a **privacy risk assessment**. In Nigeria that lands on the
  NDPA.

### OWASP, Forgot Password cheat sheet

The reset flow is the closest thing to what is being built here, and it is
worth reading as a specification rather than as advice.

- **Return a consistent message for both existent and non-existent
  accounts**, and make the response **take the same time** either way.
- **Rate limit per account**, and add a CAPTCHA or equivalent, or an
  attacker can flood a person's inbox with reset requests.
- Tokens must be **cryptographically random**, single use, and **expire**.
- **"You must ensure that a user always has a way to recover their account,
  even if that involves contacting the support team and proving their
  identity to staff."**
- **Do not lock accounts out in response to a reset attack**, because that
  is a denial of service against known usernames.

### OWASP, Insecure Direct Object Reference cheat sheet

The attack this feature could accidentally create.

- An IDOR needs three things: an **object**, a **reference** to it, and a
  **missing object-level authorisation check**.
- Identifier complexity (UUIDs, random strings) is **defence in depth only**.
  "Even with complex identifiers, access control checks are essential."
- "**Avoid exposing identifiers in URLs and POST bodies if possible.
  Instead, determine the currently authenticated user from session
  information.**"
- The secure pattern is the scoped query: `currentUser.attendance.find(...)`
  rather than `Attendance.find(params.id)`. If the object cannot be found
  **and** the caller is not allowed to have it, the response should be a
  404, not a 403, so existence stays hidden.

### Supabase, Row Level Security

This one turned up a live problem, so it gets its own section below.

- "**A table in an exposed schema without RLS is readable and writable by any
  role with a grant on it.** Enable RLS on every table in an exposed
  schema. On projects that still grant `anon` and `authenticated` by
  default, **revoke those grants. Adding policies doesn't remove them.**"
- A policy behaves like an implicit `WHERE` clause. `auth.uid()` scopes a
  row to its owner. `auth.jwt()` should never be used for anything the user
  can edit; `raw_app_meta_data` is the safe place for authorisation claims.
- Index every column a policy filters on, or the policy turns a read into a
  sequential scan.

### Supabase Auth, and the open source field

Available inside the stack already:

| Method | Cost | Notes |
|---|---|---|
| **Email magic link** | free | A link to the address. Needs a working inbox. |
| **Email OTP** | free | A six digit code by email. Same need. |
| **Phone OTP** | paid per message | SMS, or WhatsApp but only on Twilio and Twilio Verify. Default limit: one request per 60 seconds, expires in 1 hour. |
| **SSO (SAML 2.0)** | paid add-on | The right answer if the university runs Workspace, Entra or LDAP. |
| **Anonymous sign-in** | free | Gives a session with no identity. Useful for a device token, not for proof. |

Supabase's own note on phone sign-in: "Some countries have special
regulations for services that send SMS messages to users." Nigeria's DND
rules and sender registration are worth confirming before any SMS is sent.

Outside the stack, and worth knowing about:

| Project | What it is | Fit here |
|---|---|---|
| **Better Auth** | TypeScript auth, self-hosted, email OTP, phone, passkeys, 2FA, admin plugin, SSO | The strongest alternative. Would replace Supabase Auth without replacing the database. A large new dependency for one feature. |
| **Keycloak** | Full enterprise IdP | Overkill, and Java. |
| **Zitadel** | Cloud native IdP, passkeys, SAML | Viable if the university wants to run the IdP itself. |
| **Logto** | Sign-in experience, social and email OTP | Consumer leaning, good for a student sign-in page. |
| **SuperTokens** | Auth with recipe based flows | Solid, but a different architecture. |
| **PocketBase** | Single binary, SQLite, has auth and file storage | A whole new data store. Not for now. |
| **Auth.js / NextAuth** | Framework glue, not an identity store | It is not an answer to this question. |

**Conclusion on tooling: nothing new is needed.** Supabase Auth, which is
already in the project, covers every tier below. Better Auth is the fallback
if the paid SMS tier is unacceptable.

---

## What the site already has

- **The per-person code pattern**, proven in the staff area: scrypt hash for
  checking, an AES-256-GCM encrypted copy that the person who added you can
  read for 48 hours and which is then destroyed.
- **`currentStaff()` and `can()`**, so permissions are enforced in Server
  Actions rather than only hidden in the interface.
- **Row level security on every table**, and a service role that reads them
  server side.
- **Notifications and web push**, so a student who has claimed a record can
  be reminded of their own classes.

The student side can be the same pattern with a different audience.

---

## The design

### Tier 0. No identity, and no personal data

Show the attendance of each course as a **class percentage**, and a
lecturer's own per-student standing only to staff. Nobody proves anything,
nothing is exposed, and the site stays fully prerendered.

This is the floor, and it is a legitimate product on its own. It is also
what the site does today, by default, because the student view was never
built.

### Tier 1. A claim code from the department (recommended)

The same pattern as the staff codes, with the student on the other end.

1. The student opens **My attendance** and enters their **matric number**
   and a **claim code** together, in one form.
2. The server looks up the pair. The code was issued by the department and
   is bound to that matric, is single use, and expires in 48 hours.
3. On a match the student **sets their own PIN**, and from then on signs in
   with matric and PIN.
4. If they lose the PIN, the department **re-issues a claim code**. The
   same flow, from the start. There is always a way back in, which is what
   the OWASP sheet asks for.

Why this and not something cleverer:

- It costs nothing. No SMS credits, no email provider, no paid tier.
- It works on any phone, on any connection, with no third-party request.
  The site's rule of no reader-side third-party requests holds.
- It is honest about what the matric number is. The matric is the lookup
  key; the claim code is the proof.
- The department already knows how to do this. The staff area does it every
  time somebody is added.
- It is auditable. The claim appears in the same audit log the staff area
  uses.

The cost is a distribution burden: somebody has to hand out or read out the
codes. That burden is the thing to ask the department about, because no
amount of software removes it.

**The enumeration question, handled.** The form takes the matric and the
code together and says one thing whether or not the pair matched:
*"That did not work. Check the code on your slip, or ask the course rep."*
There is no separate "does this matric exist" step, so there is nothing to
enumerate. The department can also pre-issue codes for all 17 students so
that every matric has one and the answers are uniform.

### Tier 2. A code to an address the student gives you

Once a student has claimed a record, they can add an email address or a
phone number. After that, the sign-in is a **six digit code to that
address**, which is an out-of-band authenticator under NIST and gives
AAL2-ish assurance, with no password to forget or leak.

- **Email** is free and is the better first choice, if the students have
  working inboxes.
- **Phone** over SMS costs money per message and brings the Nigerian DND
  and sender registration questions with it. WhatsApp delivery is only
  available on Twilio.

### Tier 3. Sign in with the university's own accounts

If the university runs Google Workspace, Microsoft Entra ID or Active
Directory for students, this is the best answer by a distance. The student
clicks "sign in with the university" and is sent to an address the
department does not have to hold.

Supabase supports SAML 2.0 SSO for this, as a paid add-on. It is a single
configuration and the student experience is the best of the four tiers.

**This tier depends on one fact nobody has confirmed yet: do the students
have university email accounts, and what runs them?**

---

## Getting the enforcement right

The feature is one page. The risk is the API behind it.

- **The student's matric comes from the session, never from the URL.** The
  page is `/me/attendance`, and the query is scoped to the signed in
  student. There is no `?matric=` anywhere, because a URL parameter is an
  object reference and a missing check on it is an IDOR.
- **Scope the query, do not filter afterwards.** `attendance where matric =
  <the session's matric>`, not "fetch everything and filter in
  JavaScript".
- **A record that is not yours is a 404, not a 403**, so the existence of
  another student's row stays hidden.
- **Rate limit the claim attempts** per address and per matric, and lock
  out for a quarter of an hour, the way the staff sign-in already does.
- **Keep the timing uniform** between a matric with a code issued and one
  without.
- **A `student_accounts` table**: `matric`, `user_id`, `pin_hash`, `status`,
  `claimed_at`, `last_seen_at`. The claim code is stored the same way as a
  staff code: hashed for checking, encrypted for the issuer, destroyed
  after 48 hours.
- **The student's own notifications** can then be scoped to their own
  courses, which also removes the oddity that attendance notifications are
  currently course level rather than person level.

---

## A live problem the research turned up

The Supabase RLS page says a table in an exposed schema without row level
security is readable and writable by any role with a grant, and that adding
a policy does not take the grant away. That is worth checking rather than
assuming.

Checked against the live database:

- Every table in `public` had row level security **on**, so the anonymous
  role got nothing from the roster, the attendance, the staff codes or the
  files. That part was already right.
- **`app_config` did not have it.** The anonymous role held full select,
  insert, update and delete on it. It currently holds only `site_url`, which
  is not a secret, but the write access meant anybody with the public key
  could have pointed the scheduler somewhere else. And the table is where
  anything else like that would end up.
- **`_applied_migrations`**, a scratch table left behind by running the
  migration files without the command line tool, had the same exposure.

Both are fixed by `20261021000001_harden_app_config.sql`: row level security
on, the grants revoked, the scratch table dropped. The service role is
unaffected, so the site reads them exactly as before.

---

## Open questions for the department

1. **Do the students have university email addresses?** If yes, tier 2 is
   free and immediate, and tier 1 becomes a fallback rather than the plan.
2. **What runs those accounts?** Google Workspace, Microsoft 365, or
   something else? If it is the first two, tier 3 is on the table and it is
   the best experience.
3. **Will the department issue claim codes?** This is the only tier that
   needs no external dependency at all.
4. **Who is the data controller here?** The NDPC publishes a specific
   guideline for the management of personal data by public institutions in
   Nigeria, a privacy by design white paper for early stage innovation, and
   a register of data controllers of major importance. A department holding
   student attendance records is a data controller, and the Act's lawful
   basis, minimisation and data subject rights obligations apply to
   whatever is built here. The Act's text was not read for this report; the
   Commission's resource list was. This wants the department's data
   protection officer, not a developer.
5. **Is personal attendance even wanted?** Some departments prefer a
   register nobody can read individually, and the answer to the original
   question is then tier 0, deliberately.

---

## Sources

- NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and
  Lifecycle Management — https://pages.nist.gov/800-63-4/sp800-63b.html
- NIST SP 800-63B-3 (superseded 1 August 2025, read for the AAL summary) —
  https://pages.nist.gov/800-63-3/sp800-63b.html
- OWASP Cheat Sheet Series, Forgot Password —
  https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- OWASP Cheat Sheet Series, Insecure Direct Object Reference Prevention —
  https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- OWASP Cheat Sheet Series, Authentication —
  https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Supabase, Auth —
  https://supabase.com/docs/guides/auth
- Supabase, Passwordless email sign in (magic link and OTP) —
  https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase, Phone sign in —
  https://supabase.com/docs/guides/auth/phone-login
- Supabase, Enterprise Single Sign-On —
  https://supabase.com/docs/guides/auth/enterprise-sso
- Supabase, Row Level Security —
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Better Auth, Introduction — https://www.better-auth.com/docs/introduction
- Nigeria Data Protection Commission, Resources —
  https://ndpc.gov.ng/resources/
