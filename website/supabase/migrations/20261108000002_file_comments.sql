-- Migration: Add file comments system.
--
-- Run this against the Supabase database (via the SQL editor or psql).
--
-- Two tables:
--
--   file_comments        One comment anchored to a specific file + selector.
--   file_comment_replies Threaded replies to a comment.

create table if not exists public.file_comments (
  id uuid primary key default gen_random_uuid(),
  file_id text not null,
  file_kind text not null check (file_kind in ('pdf','slides','text','csv','json','email','image')),
  target_type text not null check (target_type in ('page','slide','cell','line','range')),
  target_selector jsonb not null,
  body text not null,
  author_id text,
  author_name text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists file_comments_file_idx on public.file_comments(file_id, file_kind);
create index if not exists file_comments_resolved_idx on public.file_comments(resolved);
create index if not exists file_comments_created_idx on public.file_comments(created_at desc);

create table if not exists public.file_comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.file_comments(id) on delete cascade,
  author_id text,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists file_comment_replies_comment_idx on public.file_comment_replies(comment_id, created_at);

alter table public.file_comments enable row level security;
alter table public.file_comment_replies enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comments' and policyname='Anyone can read file comments') then
    create policy "Anyone can read file comments" on public.file_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comments' and policyname='Authenticated can insert file comments') then
    create policy "Authenticated can insert file comments" on public.file_comments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comments' and policyname='Author can update own file comment') then
    create policy "Author can update own file comment" on public.file_comments for update using (author_id = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comments' and policyname='Author can delete own file comment') then
    create policy "Author can delete own file comment" on public.file_comments for delete using (author_id = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comment_replies' and policyname='Anyone can read file comment replies') then
    create policy "Anyone can read file comment replies" on public.file_comment_replies for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comment_replies' and policyname='Authenticated can insert file comment replies') then
    create policy "Authenticated can insert file comment replies" on public.file_comment_replies for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comment_replies' and policyname='Author can update own file comment reply') then
    create policy "Author can update own file comment reply" on public.file_comment_replies for update using (author_id = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='file_comment_replies' and policyname='Author can delete own file comment reply') then
    create policy "Author can delete own file comment reply" on public.file_comment_replies for delete using (author_id = auth.uid()::text);
  end if;
end $$;
