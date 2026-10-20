-- The scheduler.
--
-- The class reminders are the only notifications that need a clock, and a
-- clock is the one thing a free plan gives you least of. Vercel's cron runs
-- once a day on the free plan, which is not enough for "starts in five
-- minutes", so this calls the same endpoint from Supabase's own cron every
-- five minutes instead.
--
-- The call goes over the network with a shared secret in a header, because
-- pg_cron cannot call a function inside the database and the endpoint is
-- where the VAPID keys and the subscriptions live.
--
-- The secret is PUSH_SCHEDULE_SECRET. It is in the Supabase project's Vault
-- and in the deployment's environment, and it is not the same thing as
-- ADMIN_SECRET, which is about people.
--
-- If neither cron is working, the class reminders still arrive for anybody
-- who has the site open, because the browser times them itself.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Where the site is.
--
-- The scheduler runs inside the database and has to reach out to the site, so
-- it needs to be told where the site is. It is a table rather than a constant
-- because a deployment on a preview URL needs a different answer, and
-- changing that should not mean editing a function body.
create table if not exists public.app_config (
  key text primary key,
  value text not null
);

insert into public.app_config (key, value)
values ('site_url', 'https://thehood.vercel.app')
on conflict (key) do update set value = excluded.value;

-- The shared secret, held in the vault so it is not in the function body.
do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'push_schedule_secret'
  ) then
    perform vault.create_secret(
      'push_schedule_secret',
      'hgK4mZp7QwR2sTx9YbVn3LcJf8DhAeUg',
      'The secret the notification scheduler uses when it calls the push endpoint'
    );
  end if;
end;
$$;

-- The call itself.
--
-- Every five minutes, with the secret read from the vault rather than
-- written here, so rotating it in one place is enough.
create or replace function public.push_schedule()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  secret text;
  site text;
begin
  select decrypted_secret into secret
    from vault.decrypted_secrets
   where name = 'push_schedule_secret';

  select value into site from public.app_config where key = 'site_url';

  if secret is null or site is null then
    return;
  end if;

  perform net.http_post(
    url     := site || '/api/push/schedule',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', secret
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
exception
  when others then
    -- A scheduler that throws is worse than a scheduler that does nothing.
    null;
end;
$$;

-- The schedule. Every five minutes, which is how close the "starts in five
-- minutes" reminder can be to the start of the class.
select cron.schedule(
  'push-schedule',
  '*/5 * * * *',
  'select public.push_schedule();'
);

comment on function public.push_schedule() is
  'Calls the push scheduler every five minutes with the shared secret.';
