-- Course videos.
--
-- A lecturer has a recording of the lecture, or a recording of somebody
-- else's lecture that is worth a student's afternoon. It belongs with the
-- course, so it is indexed with the course rather than being a link buried
-- in a document.
--
-- The thumbnail is kept here rather than being fetched from YouTube by the
-- reader's browser. A page that asks somebody else's server for an image
-- tells that server who was reading, and the rule on this site is that a
-- reader's browser does not talk to anybody but us. The server fetches the
-- picture once and the reader gets it from this site's own address.
--
-- The video itself is YouTube's, and a reader who presses play loads it
-- from there. That is a deliberate act by somebody who wants to watch a
-- video, and the embed is the one that does not set tracking cookies until
-- it is played.

create table if not exists public.course_videos (
  id text primary key,
  course text not null,
  title text not null,
  -- The eleven characters YouTube calls the video.
  youtube_id text not null,
  -- A line about what the video is, in the lecturer's own words.
  note text,
  -- The order the videos appear in.
  position integer not null default 0,
  -- The key of the thumbnail in the bucket. Null when the picture could not
  -- be fetched, and the card draws its own mark instead.
  thumb_path text,
  added_by text,
  created_at timestamptz not null default now(),
  -- One copy of a video on a course.
  unique (course, youtube_id)
);

create index if not exists course_videos_course_idx
  on public.course_videos (course, position);

comment on table public.course_videos is
  'The videos that belong to a course, with their thumbnails kept on this site.';

-- Row level security, as everywhere else here.
alter table public.course_videos enable row level security;

revoke all on public.course_videos from public, anon, authenticated;
