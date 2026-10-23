-- Add digest_mode preference: when enabled, the site sends one daily digest
-- instead of individual push notifications for each class.
alter table public.notification_prefs
add column digest_mode boolean not null default false;

comment on column public.notification_prefs.digest_mode is
  'When true, send one daily digest instead of individual push notifications for each class.';