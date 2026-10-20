-- Notifications.
--
-- A subscription is a device, not a person. The students have no accounts,
-- so there is nothing here that says who a device belongs to, and a
-- subscription row carries no name and no matric number.
--
-- The preferences are per device for the same reason: the device is the only
-- thing we can put a name to, and pretending otherwise would be inventing an
-- identity system that does not exist.

create table if not exists public.notification_prefs (
  -- A random id the browser keeps. It identifies a device to us and nothing
  -- else; it is not tied to a person and it carries nothing about them.
  device_id text primary key,
  -- Which kinds this device wants. Empty means all of them.
  kinds text[] not null default '{}',
  -- Which courses this device cares about. Empty means all of them.
  courses text[] not null default '{}',
  -- Local quiet hours, in the device's own clock.
  quiet_from text not null default '22:00',
  quiet_to text not null default '06:00',
  -- The device's timezone, so the quiet hours mean what the reader means.
  tz text not null default 'Africa/Lagos',
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  -- The browser's push endpoint. It is a long opaque URL and is unique.
  endpoint text unique not null,
  -- The keys the push service needs to encrypt for this device.
  p256dh text not null,
  auth text not null,
  user_agent text,
  -- When the device was last seen, so a dead subscription can be pruned.
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_device_idx
  on public.push_subscriptions (device_id);

comment on table public.push_subscriptions is
  'One row per browser that asked for push. Says nothing about who owns it.';

-- What has already been sent, so the same thing is not said twice.
--
-- The key is what makes it idempotent: a class that starts at ten past two
-- gets one key for the reminder and a different one for the class itself, and
-- a scheduler that runs twice sends nothing the second time.
create table if not exists public.notifications_sent (
  id bigint generated always as identity primary key,
  -- What makes this notification unique.
  dedupe_key text unique not null,
  kind text not null,
  title text not null,
  body text,
  -- The courses it was about, so one push can be filtered later.
  course text,
  sent_at timestamptz not null default now()
);

create index if not exists notifications_sent_at_idx
  on public.notifications_sent (sent_at desc);

comment on table public.notifications_sent is
  'What has been sent, so the same notification is not sent twice.';

-- The health of the things the site depends on.
--
-- The news feed fails silently by design, which is right for a reader and
-- wrong for the person who runs the site. This is where the failure is
-- recorded so it can be told to somebody.
create table if not exists public.system_health (
  key text primary key,
  ok boolean not null,
  detail text,
  checked_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications_sent enable row level security;
alter table public.system_health enable row level security;

revoke all on table public.notification_prefs from public, anon, authenticated;
revoke all on table public.push_subscriptions from public, anon, authenticated;
revoke all on table public.notifications_sent from public, anon, authenticated;
revoke all on table public.system_health from public, anon, authenticated;
