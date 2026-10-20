-- The file index.
--
-- The course files themselves live in two places, and this table is the index
-- that says which file belongs to which course. The index is the part that
-- needs to be a database: staff add to it and remove from it without a
-- redeploy.
--
--   source = 'archive'  the file lives in the repository and is served from
--                        the site's own public folder. It cannot be deleted
--                        from here, because deleting it from the index would
--                        leave the file in the repository forever.
--   source = 'upload'   the file lives in Supabase Storage and was added
--                        through the staff area. It can be removed from here.
--
-- The archive keeps being served from the repository on purpose: the site's
-- CDN does not charge for the traffic, and a whole class downloading their
-- course material every week is exactly the traffic a metered bucket would
-- charge for.

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  title text not null,
  type text not null check (type in ('pdf', 'pptx', 'xlsx', 'doc', 'other')),
  -- Where the file is served from. A path for an archive file, an absolute
  -- URL for an uploaded one.
  url text not null,
  size bigint,
  source text not null default 'upload' check (source in ('archive', 'upload')),
  -- The key in the storage bucket, for an uploaded file. Null for an archive
  -- file, which is not in the bucket.
  storage_path text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  -- One file per course per title. Staff should not be able to add the same
  -- handout twice by accident.
  unique (course, title)
);

create index if not exists files_course_idx on public.files (course);

comment on table public.files is
  'The index of course files. Archive files live in the repository, uploaded files live in Supabase Storage.';

-- Row level security, as everywhere else here.
alter table public.files enable row level security;

revoke all on table public.files from public, anon, authenticated;
