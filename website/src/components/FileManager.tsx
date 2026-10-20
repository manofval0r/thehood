"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  removeCourseFile,
  uploadCourseFile,
  type UploadState,
} from "@/app/admin/actions";

/**
 * The file manager.
 *
 * A file is chosen, given a course, and put there. The upload goes to
 * Supabase Storage and the index is written after it, so a file that fails
 * to store never appears on the course page as a broken link.
 *
 * The archive is shown beside the uploads, read only. Those files live in
 * the repository and are served from the site's own folder, so they cannot
 * be taken away from here: deleting one from the index would leave the file
 * itself sitting in the public folder with nothing pointing at it.
 */

export interface FileRow {
  id: string;
  course: string;
  title: string;
  type: string;
  size: number | null;
  source: "archive" | "upload";
}

export interface FileCourse {
  code: string;
  title: string;
}

function humanSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileManager({
  courses,
  files,
}: {
  courses: FileCourse[];
  files: FileRow[];
}) {
  const [course, setCourse] = useState(courses[0]?.code ?? "");
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadCourseFile,
    {}
  );

  // The list is kept here and refreshed from the endpoint rather than being
  // pushed down from the server. This page is a partial prerender, and the
  // part that holds the list is streamed, so asking the router to refetch the
  // route does not reliably redraw it. Fetching the list here means the
  // reader sees the file they just added without waiting for a page load,
  // and it is the same thing the search does.
  const [rows, setRows] = useState<FileRow[]>(files);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/files", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setRows(data as FileRow[]);
    } catch {
      // The list that is already on screen stays. It is the server's copy
      // and it is not wrong, only a moment behind.
    }
  }, []);

  useEffect(() => {
    if (state.done) load();
  }, [state.done, load]);

  async function handleRemove(id: string) {
    await removeCourseFile(id);
    await load();
  }

  const onCourse = rows.filter((f) => f.course === course);

  return (
    <section className="mt-12">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        Course files
      </h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        A file added here appears on the course page, in the search and in the
        counts, without the site being rebuilt. Twenty-five megabytes is the
        limit.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {courses.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCourse(c.code)}
            className={
              "pressable rounded-full border px-3 py-1 text-[12px] font-medium " +
              (c.code === course
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c.code}
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-5 max-w-2xl">
        <input type="hidden" name="course" value={course} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="file"
              className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              The file
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-[12px] file:font-semibold file:text-accent-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              What it is called
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Lecture 3 slides"
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted focus-visible:border-accent"
            />
            <p className="mt-1.5 text-[11.5px] text-muted">
              Leave it empty to use the file name.
            </p>
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="mt-3 text-[12.5px] text-foreground">
            {state.error}
          </p>
        ) : null}
        {state.done ? (
          <p className="mt-3 text-[12.5px] text-accent">{state.done}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !course}
          className="pressable mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Uploading" : "Add the file"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
          {onCourse.length} on {course}
        </h3>

        {onCourse.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Nothing on {course} yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {onCourse.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {f.title}
                </span>
                <span className="shrink-0 font-mono text-[11px] uppercase text-muted">
                  {f.type}
                </span>
                <span className="shrink-0 text-[11.5px] text-muted">
                  {humanSize(f.size)}
                </span>
                {f.source === "upload" ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(f.id)}
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground"
                  >
                    Remove
                  </button>
                ) : (
                  <span
                    className="shrink-0 text-[11px] text-muted"
                    title="This file lives in the repository and is served from the site's own folder, so it cannot be removed from here."
                  >
                    in the repository
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
