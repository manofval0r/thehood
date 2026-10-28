-- Campus bulletin, managed Outlook source, one-occurrence overrides and RSVP.

create table if not exists public.bulletin_items (
  id text primary key,
  kind text not null check (kind in ('class', 'alert', 'notice', 'event', 'deadline', 'resource')),
  source text not null check (source in ('admin', 'outlook', 'timetable', 'academic_calendar', 'assessment', 'resource')),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'archived')),
  title text not null,
  body text not null default '',
  course text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  meeting_url text,
  source_url text,
  source_external_id text,
  source_updated_at timestamptz,
  pinned boolean not null default false,
  urgent boolean not null default false,
  rsvp_enabled boolean not null default false,
  expires_at timestamptz,
  published_at timestamptz,
  created_by text,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bulletin_time_order check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create unique index if not exists bulletin_source_external_unique
  on public.bulletin_items (source, source_external_id)
  where source_external_id is not null;
create index if not exists bulletin_active_idx
  on public.bulletin_items (status, pinned desc, starts_at, published_at desc);
create index if not exists bulletin_expiry_idx
  on public.bulletin_items (expires_at)
  where status = 'published';

create table if not exists public.bulletin_rsvps (
  bulletin_id text not null references public.bulletin_items(id) on delete cascade,
  matric text not null,
  response text not null check (response in ('going', 'unsure', 'not_going')),
  responded_at timestamptz not null default now(),
  primary key (bulletin_id, matric)
);

create index if not exists bulletin_rsvps_matric_idx
  on public.bulletin_rsvps (matric, responded_at desc);

create table if not exists public.class_occurrence_overrides (
  id text primary key,
  occurrence_key text not null unique,
  source_event_id text,
  course text not null,
  action text not null check (action in ('cancel', 'change')),
  status text not null default 'active' check (status in ('active', 'restored')),
  original jsonb not null,
  proposed jsonb not null,
  reason text not null,
  created_by text not null,
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  restored_at timestamptz,
  restored_by text
);

create index if not exists class_overrides_course_idx
  on public.class_occurrence_overrides (course, status, updated_at desc);

create table if not exists public.calendar_connections (
  provider text primary key check (provider in ('outlook')),
  refresh_token_cipher text not null,
  access_token_cipher text,
  access_token_expires_at timestamptz,
  account_email text,
  scopes text[] not null default '{}',
  connected_by text not null,
  connected_by_name text not null,
  connected_at timestamptz not null default now(),
  synced_at timestamptz,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'ok', 'error')),
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.outlook_events (
  id text primary key,
  external_id text not null unique,
  subject text not null,
  body_preview text not null default '',
  course text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  join_url text,
  web_url text,
  is_cancelled boolean not null default false,
  source_updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  constraint outlook_event_time_order check (ends_at > starts_at)
);

create index if not exists outlook_events_window_idx
  on public.outlook_events (starts_at, ends_at);
create index if not exists outlook_events_course_idx
  on public.outlook_events (course, starts_at);

comment on table public.bulletin_items is
  'Published and draft cohort notices. Meeting URLs never leave server-only DTOs.';
comment on table public.class_occurrence_overrides is
  'Audited super-admin decisions that override one Outlook or timetable occurrence.';
comment on table public.calendar_connections is
  'Encrypted server-only OAuth credentials for the managed cohort Outlook connection.';

alter table public.bulletin_items enable row level security;
alter table public.bulletin_rsvps enable row level security;
alter table public.class_occurrence_overrides enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.outlook_events enable row level security;

revoke all on table public.bulletin_items from public, anon, authenticated;
revoke all on table public.bulletin_rsvps from public, anon, authenticated;
revoke all on table public.class_occurrence_overrides from public, anon, authenticated;
revoke all on table public.calendar_connections from public, anon, authenticated;
revoke all on table public.outlook_events from public, anon, authenticated;
