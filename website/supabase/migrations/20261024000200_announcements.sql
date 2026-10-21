-- Announcements.
--
-- A message a super admin sends to everybody who has turned their
-- notifications on. The commonest one is "the class is cancelled today",
-- which is the kind of thing a student must not find out by turning up.
--
-- It is a table rather than a row in notifications_sent because an
-- announcement has a life of its own: it can be written now and sent
-- later, it is addressed to a course or to everybody, it can be urgent,
-- and somebody has to be able to look at what was said and to whom.
--
-- The counts on the row are what makes that possible. "We told them" is
-- not the same claim as "eighteen people were told", and only the second
-- one is worth keeping.

create table if not exists public.announcements (
  id text primary key,
  -- What the notification says.
  title text not null,
  body text not null,
  -- The kind it counts as, so a reader who has turned one kind off does
  -- not get this one either.
  kind text not null,
  -- The course it is about. Null means everybody.
  course text,
  -- Where it goes when it is clicked.
  href text,
  -- Urgent means it comes even in the middle of the night, which is the
  -- one thing a quiet hour is not for.
  urgent boolean not null default false,
  -- Whether the readers are asked to say they have seen it. A
  -- cancellation is worth knowing they have.
  needs_ack boolean not null default false,
  -- 'sent', 'scheduled' or 'cancelled'.
  status text not null default 'sent',
  -- When a scheduled announcement goes out.
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  created_by text,
  created_by_name text,
  -- When it actually went out.
  sent_at timestamptz,
  -- How many devices it reached, how many it did not, and how many
  -- subscriptions the push service had thrown away.
  sent_count integer not null default 0,
  skipped_count integer not null default 0,
  gone_count integer not null default 0
);

create index if not exists announcements_created_idx
  on public.announcements (created_at desc);

create index if not exists announcements_scheduled_idx
  on public.announcements (scheduled_for)
  where status = 'scheduled';

comment on table public.announcements is
  'The messages a super admin sends to the students, and how far they got.';

-- Who has said they have seen an announcement.
--
-- A device, not a person, for the same reason a subscription is a device:
-- the students have no accounts, so there is nothing here that says who a
-- device belongs to. The count is a count of devices that said they had
-- seen it, and it is labelled that way wherever it is shown.
create table if not exists public.announcement_acks (
  announcement_id text not null,
  device_id text not null,
  at timestamptz not null default now(),
  primary key (announcement_id, device_id)
);

create index if not exists announcement_acks_device_idx
  on public.announcement_acks (device_id);

comment on table public.announcement_acks is
  'Which devices have said they have seen an announcement.';

alter table public.announcements enable row level security;
alter table public.announcement_acks enable row level security;

revoke all on table public.announcements from public, anon, authenticated;
revoke all on table public.announcement_acks from public, anon, authenticated;

-- The shared secret for the scheduler.
--
-- The row was written with its name and its value the other way round: the
-- name held the secret and the value held the label. The lookup the
-- scheduler does is by name, so it found nothing and the scheduler had
-- nothing to send. This puts it right for a database created from the
-- migrations, and leaves a correct one alone.
do $$
declare
  wrong_name text;
  wrong_secret text;
begin
  select name, decrypted_secret
    into wrong_name, wrong_secret
    from vault.decrypted_secrets
   where name <> 'push_schedule_secret'
   limit 1;

  -- The name holds the secret and the value holds the label, so the
  -- secret is the name.
  if wrong_name is not null and wrong_secret = 'push_schedule_secret' then
    delete from vault.secrets where name = wrong_name;
    perform vault.create_secret(
      wrong_name,
      'push_schedule_secret',
      'The secret the notification scheduler uses when it calls the push endpoint'
    );
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets where name = 'push_schedule_secret'
  ) then
    perform vault.create_secret(
      'hgK4mZp7QwR2sTx9YbVn3LcJf8DhAeUg',
      'push_schedule_secret',
      'The secret the notification scheduler uses when it calls the push endpoint'
    );
  end if;
end;
$$;
