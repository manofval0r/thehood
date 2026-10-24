"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Loader2, Pencil, Play, Trash2, X } from "lucide-react";
import PixelMotif from "@/components/PixelMotif";
import {
  addCourseVideo,
  removeCourseVideo,
  updateCourseVideo,
  type VideoState,
} from "@/app/admin/actions";

/**
 * The videos of a course.
 *
 * A lecture recording, or a recording of somebody else's lecture that is
 * worth a student's afternoon. The picture is fetched by the server and kept
 * on this site, so a reader's browser never asks YouTube for it.
 */
export interface VideoRow {
  id: string;
  course: string;
  title: string;
  youtube_id: string;
  note: string | null;
  position: number;
  thumb_path: string | null;
  added_by?: string | null;
}

export default function VideoManager({
  course,
  courseTitle,
  videos,
  thumbBase,
}: {
  /** The course the manager is working on, chosen once for both tabs. */
  course: string;
  /** The full name, so the course is never identified by its code alone. */
  courseTitle: string;
  videos: VideoRow[];
  /** The address the pictures are served from, on this site. */
  thumbBase: string;
}) {
  const [rows, setRows] = useState<VideoRow[]>(videos);
  const [state, setState] = useState<VideoState>({});
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const here = useMemo(
    () => rows.filter((v) => v.course === course),
    [rows, course]
  );

  const submit = useCallback(
    async (formData: FormData) => {
      setPending(true);
      setState({});
      try {
        const result = await addCourseVideo({}, formData);
        setState(result);
        if (result.video) {
          setRows((r) => [...r, result.video as VideoRow]);
        }
      } finally {
        setPending(false);
      }
    },
    []
  );

  const remove = async (id: string) => {
    await removeCourseVideo(id);
    setRows((r) => r.filter((v) => v.id !== id));
  };

  const save = async (id: string, title: string, note: string) => {
    await updateCourseVideo(id, title, note);
    setRows((r) => r.map((v) => (v.id === id ? { ...v, title, note: note || null } : v)));
    setEditing(null);
  };

  return (
    <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="min-w-0">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
          Videos
        </h2>
        <p className="mt-1 text-[12px] font-medium text-muted-foreground">
          {courseTitle}
          <span className="ml-1.5 font-mono text-[10.5px] text-muted">
            {course}
          </span>
        </p>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        A lecture recording, or a recording worth a student&apos;s afternoon.
        The picture is fetched by the server and kept on this site, so a
        reader&apos;s browser never asks YouTube for it. The video is played
        from YouTube when somebody presses play.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300"
        >
          {state.error}
        </p>
      )}
      {state.done && (
        <p
          role="status"
          className="mt-3 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-[12.5px] text-accent"
        >
          {state.done}
        </p>
      )}

      <form
        className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        action={submit}
      >
        <input type="hidden" name="course" value={course} />
        <p className="text-[11.5px] leading-relaxed text-muted-foreground sm:col-span-2">
          Adding to{" "}
          <span className="font-medium text-foreground">{courseTitle}</span>{" "}
          <span className="font-mono text-[10.5px]">({course})</span>
        </p>
        <label className="block sm:col-span-2">
          <span className="text-[11.5px] text-muted">The link</span>
          <input
            name="url"
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] text-muted">What it is called</span>
          <input
            name="title"
            placeholder="Week 3, the lecture"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] text-muted">
            A line about it (optional)
          </span>
          <input
            name="note"
            placeholder="The second half of the buffer overflows lecture."
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="pressable inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[12.5px] font-medium text-accent-foreground disabled:opacity-50 max-sm:min-h-11 max-sm:px-4 max-sm:text-base"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {pending ? "Fetching the picture" : "Add the video"}
          </button>
        </div>
      </form>

      <ul className="mt-5 divide-y divide-border border-y border-border">
        {here.length === 0 ? (
          <li className="py-6 text-center text-[13px] text-muted-foreground">
            No videos on {courseTitle} yet.
          </li>
        ) : (
          here.map((video) => (
            <li key={video.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="w-16 shrink-0 overflow-hidden rounded bg-black">
                {video.thumb_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${thumbBase}/${video.thumb_path}`}
                    alt=""
                    className="h-9 w-16 object-cover"
                  />
                ) : (
                  <span className="grid h-9 w-16 place-items-center">
                    <PixelMotif
                      kind="video"
                      title="A video player with a play triangle and a progress bar"
                      className="h-5 w-5"
                    />
                  </span>
                )}
              </span>

              {editing === video.id ? (
                <EditRow
                  video={video}
                  onCancel={() => setEditing(null)}
                  onSave={(title, note) => save(video.id, title, note)}
                />
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">
                      {video.title}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {video.note || video.youtube_id}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 max-sm:w-full max-sm:justify-end max-sm:gap-1">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground max-sm:inline-flex max-sm:min-h-11 max-sm:items-center max-sm:px-3"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditing(video.id)}
                      aria-label={`Edit ${video.title}`}
                      className="pressable inline-flex shrink-0 items-center justify-center rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground max-sm:h-11 max-sm:w-11"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(video.id)}
                      aria-label={`Delete ${video.title}`}
                      className="pressable inline-flex shrink-0 items-center justify-center rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground max-sm:h-11 max-sm:w-11"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function EditRow({
  video,
  onSave,
  onCancel,
}: {
  video: VideoRow;
  onSave: (title: string, note: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(video.title);
  const [note, setNote] = useState(video.note ?? "");

  return (
    <>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:basis-full max-sm:text-base"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A line about it"
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:basis-full max-sm:text-base"
      />
      <button
        type="button"
        onClick={() => onSave(title, note)}
        aria-label="Save the video details"
        className="pressable inline-flex shrink-0 items-center justify-center rounded px-2 py-1 text-[11.5px] text-accent transition-opacity hover:opacity-75 max-sm:h-11 max-sm:w-11"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel the video edit"
        className="pressable inline-flex shrink-0 items-center justify-center rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground max-sm:h-11 max-sm:w-11"
      >
        <X size={14} />
      </button>
    </>
  );
}
