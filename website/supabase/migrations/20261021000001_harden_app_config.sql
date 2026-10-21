-- Lock down the two tables that were left open.
--
-- Every other table in the public schema has row level security on, which
-- means the anonymous role, which a browser could hold, gets nothing from
-- them. The settings table did not have it, and it holds the address the
-- scheduler calls. The anonymous role also had full write access to it, so
-- anybody with the public key could have pointed the scheduler somewhere
-- else.
--
-- The scratch table from the ad hoc migration runner goes as well. It was
-- left over from running the migration files without the command line tool,
-- and it was readable and writable by the same anonymous role.
--
-- The service role is not affected. It holds its own grants and it carries
-- the bypass attribute, so the site reads these tables the way it always
-- has.

alter table public.app_config enable row level security;
revoke all on table public.app_config from anon, authenticated;

drop table if exists public._applied_migrations;
