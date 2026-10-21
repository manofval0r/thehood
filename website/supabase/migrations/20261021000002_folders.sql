-- Folders.
--
-- A course is not a flat list of files. The lab manual for CYB 305 has a
-- tree under it: the manual itself, a folder of source evidence, a folder
-- of working copies. Those folders are already there on disk and the index
-- knows where each file is, but there was nowhere to say "Assessment 1" for
-- a folder that has nothing in it yet, and nowhere to say that a file has
-- been moved.
--
-- So a folder is a column on the file, and a table for the folders that
-- exist on their own.
--
-- The column is nullable on purpose. A file with nothing in the index takes
-- the folder its address implies, which is how the archive files keep the
-- folders they already have on disk. Staff set it when they move something.
--
-- Moving a file is then one column. It does not move the file on disk and
-- it does not move the object in the bucket, so it is instant and it costs
-- nothing, and the folder a student sees is the folder the index says.

alter table public.files add column if not exists folder text;

-- Two handouts on the same course may share a title if they are in
-- different folders. "Week 1 notes" under Assessment 1 and the same under
-- Assessment 2 are different handouts. The old constraint made that
-- impossible.
alter table public.files drop constraint if exists files_course_title_key;

create unique index if not exists files_course_folder_title_idx
  on public.files (course, coalesce(folder, ''), title);

create table if not exists public.course_folders (
  id text primary key,
  course text not null,
  -- The path inside the course. "Assessment 1", or "Assessment 1/Lab Manual".
  path text not null,
  created_at timestamptz not null default now(),
  unique (course, path)
);

create index if not exists course_folders_course_idx
  on public.course_folders (course);

comment on table public.course_folders is
  'The folders in a course, including the ones with nothing in them yet.';

-- Row level security, as everywhere else here.
alter table public.course_folders enable row level security;

revoke all on public.course_folders from public, anon, authenticated;
