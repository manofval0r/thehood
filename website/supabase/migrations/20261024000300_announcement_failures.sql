-- What a message did not reach.
--
-- A message can be sent to everybody and reach nobody, and there are two
-- reasons for it that need different answers. A reader who turned that
-- kind of notification off, or who was in their quiet hours, is a fact
-- about the readers and nothing to fix. A push the service refused is a
-- fact about the site, and it is the one somebody has to do something
-- about.
--
-- The count is kept so the history can say which of the two happened,
-- rather than saying "sent" and leaving the reader to guess.

alter table public.announcements
  add column if not exists failed_count integer not null default 0;

comment on column public.announcements.failed_count is
  'How many pushes the service refused. Different from the ones that were skipped.';
