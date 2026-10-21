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
  courses,
  videos,
  thumbBase,
}: {
  courses: { code: string; title: string }[];
  videos: VideoRow[];
  /** The address the pictures are served from, on this site. */
  thumbBase: string;
}) {
  const [course, setCourse] = useState(courses[0]?.code ?? "");
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
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
        Course videos
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
        A lecture recording, or a recording worth a student&apos;s afternoon.
        The picture is fetched by the server and kept on this site, so a
        reader&apos;s browser never asks YouTube for it. The video is played
        from YouTube when somebody presses play.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {courses.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCourse(c.code)}
            className={`pressable rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              c.code === course
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

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
        <label className="block sm:col-span-2">
          <span className="text-[11.5px] text-muted">The link</span>
          <input
            name="url"
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] text-muted">What it is called</span>
          <input
            name="title"
            placeholder="Week 3, the lecture"
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-[11.5px] text-muted">
            A line about it (optional)
          </span>
          <input
            name="note"
            placeholder="The second half of the buffer overflows lecture."
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="pressable inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[12.5px] font-medium text-accent-foreground disabled:opacity-50"
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
            No videos on {course} yet.
          </li>
        ) : (
          here.map((video) => (
            <li key={video.id} className="flex items-center gap-3 py-2.5">
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
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditing(video.id)}
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(video.id)}
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                  >
                    <Trash2 size={13} />
                  </button>
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
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A line about it"
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent"
      />
      <button
        type="button"
        onClick={() => onSave(title, note)}
        className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-accent transition-opacity hover:opacity-75"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
      >
        <X size={14} />
      </button>
    </>
  );
}
