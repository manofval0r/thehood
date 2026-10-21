import "server-only";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { rest, storage, storeConfig } from "@/lib/rest";
import { COURSES } from "@/lib/resources";

/**
 * The videos that belong to a course.
 *
 * A lecture recording, or a recording of somebody else's lecture that is
 * worth a student's afternoon. It is indexed with the course so that it
 * sits with the slides and the notes rather than in a document somewhere.
 *
 * The thumbnail is kept on this site. YouTube's picture is fetched once, by
 * the server, and the reader gets it from this site's own address, because a
 * page that asks somebody else's server for an image tells that server who
 * was reading. The video itself is YouTube's, and a reader who presses play
 * loads it from there, from the embed that does not set tracking cookies
 * until it is played.
 */

export interface CourseVideo {
  id: string;
  course: string;
  title: string;
  youtube_id: string;
  note: string | null;
  position: number;
  thumb_path: string | null;
  added_by: string | null;
  created_at: string;
}

const BUCKET = "video-thumbs";

/** YouTube's picture of a video. */
const THUMBNAILS = [
  "maxresdefault.jpg",
  "hqdefault.jpg",
  "sddefault.jpg",
];

/**
 * The eleven characters YouTube calls a video, from whatever the lecturer
 * pasted.
 *
 * People paste every shape of link there is: the watch link with the
 * tracking on it, the short one, the embed one, a shorts link, a live link,
 * and sometimes the eleven characters on their own.
 */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const found = pattern.exec(value);
    if (found) return found[1];
  }
  return null;
}

/** The address of the picture we keep. */
export function thumbnailUrl(video: CourseVideo): string | null {
  if (!video.thumb_path) return null;
  const base = thumbBaseUrl();
  if (!base) return null;
  return `${base}/${video.thumb_path.split("/").map(encodeURIComponent).join("/")}`;
}

/** The address the pictures are served from, on this site. */
export function thumbBaseUrl(): string | null {
  const { url } = storeConfig() ?? { url: "" };
  if (!url) return null;
  return `${url}/storage/v1/object/public/${BUCKET}`;
}

/** The embed address, which is the one that does not track until it plays. */
export function embedUrl(video: CourseVideo): string {
  return `https://www.youtube-nocookie.com/embed/${video.youtube_id}?rel=0&modestbranding=1`;
}

/** The page on YouTube, for a reader who would rather go there. */
export function watchUrl(video: CourseVideo): string {
  return `https://www.youtube.com/watch?v=${video.youtube_id}`;
}

/* --------------------------------------------------------------- reading */

/** The videos of a course, in the order the staff put them in. */
export async function getCourseVideos(course: string): Promise<CourseVideo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("videos");

  if (!storeConfig()) return [];

  try {
    const rows = await rest<CourseVideo[]>(
      `course_videos?course=eq.${encodeURIComponent(
        course
      )}&select=*&order=position.asc,created_at.asc`
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

/** The videos of every course, for the staff area. */
export async function getAllVideos(): Promise<CourseVideo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("videos");

  if (!storeConfig()) return [];

  try {
    const rows = await rest<CourseVideo[]>(
      "course_videos?select=*&order=course.asc,position.asc,created_at.asc"
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------- writing */

/** Makes sure the bucket for the pictures exists. Safe to run again. */
export async function ensureThumbBucket(): Promise<void> {
  const head = await storage(`bucket/${BUCKET}`);
  if (head.ok) return;

  await storage("bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 2 * 1024 * 1024,
    }),
  });
}

/**
 * Fetches the picture of a video and keeps it here.
 *
 * The fetch is on the server. YouTube sends three sizes and only one of
 * them is always there, so they are tried in turn and the first that
 * answers is the one that is kept. A video with no picture is not a
 * failure: the card draws its own mark instead.
 */
async function fetchThumbnail(youtubeId: string): Promise<string | null> {
  for (const name of THUMBNAILS) {
    try {
      const res = await fetch(
        `https://i.ytimg.com/vi/${youtubeId}/${name}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;

      const bytes = Buffer.from(await res.arrayBuffer());
      // The "not found" picture is a grey box, and it is small.
      if (bytes.length < 1500) continue;

      const path = `${youtubeId}.jpg`;
      const put = await storage(`object/${BUCKET}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg", "x-upsert": "true" },
        body: bytes,
      });
      if (put.ok) return path;
    } catch {
      // Try the next size.
    }
  }
  return null;
}

/** Add a video to a course. */
export async function addVideo(args: {
  course: string;
  url: string;
  title: string;
  note?: string;
  addedBy: string;
}): Promise<CourseVideo> {
  const youtubeId = parseYoutubeId(args.url);
  if (!youtubeId) {
    throw new Error(
      "That does not look like a YouTube link. Paste the link from the Share button, or the eleven characters of the video id."
    );
  }

  const title = args.title.trim() || `Video ${youtubeId}`;
  await ensureThumbBucket();
  const thumb = await fetchThumbnail(youtubeId);

  // The order the videos appear in. A plain count rather than a clock: a
  // clock is a number too large for the column, and an order that is the
  // order they were added is the one anybody expects.
  const last = await rest<{ position: number }[]>(
    `course_videos?course=eq.${encodeURIComponent(
      args.course
    )}&select=position&order=position.desc&limit=1`
  );
  const position = (last?.[0]?.position ?? 0) + 1;

  const row = {
    id: `vid_${crypto.randomUUID().slice(0, 8)}_${Date.now().toString(36)}`,
    course: args.course,
    title,
    youtube_id: youtubeId,
    note: args.note?.trim() || null,
    position,
    thumb_path: thumb,
    added_by: args.addedBy,
  };

  const created = await rest<CourseVideo[]>("course_videos", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("23505") || message.includes("duplicate key")) {
      throw new Error("That video is already on this course.");
    }
    throw error;
  });

  updateTag("videos");
  return created[0] as CourseVideo;
}

/** Take a video off a course. */
export async function removeVideo(id: string): Promise<void> {
  const rows = await rest<(CourseVideo & { thumb_path: string | null })[]>(
    `course_videos?id=eq.${encodeURIComponent(id)}&select=*`
  );
  const row = rows?.[0];
  if (!row) return;

  if (row.thumb_path) {
    await storage(
      `object/${BUCKET}/${row.thumb_path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      { method: "DELETE" }
    );
  }

  await rest(`course_videos?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  updateTag("videos");
}

/** Change what a video is called and what it says. */
export async function updateVideo(
  id: string,
  title: string,
  note: string
): Promise<void> {
  await rest(`course_videos?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title: title.trim(), note: note.trim() || null },
  });
  updateTag("videos");
}

/** The courses that can have videos, for the staff area. */
export function videoCourses() {
  return COURSES.map((c) => ({ code: c.code, title: c.title }));
}
