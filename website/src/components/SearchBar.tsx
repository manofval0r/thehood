"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  FileText,
  Presentation,
  Tablet,
  FileCode,
  X,
  BookOpen,
} from "lucide-react";
import { COURSES } from "@/lib/resources";
import type { Course, Resource } from "@/lib/resources";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  pptx: Presentation,
  xlsx: Tablet,
  doc: FileCode,
  other: FileText,
};

type CourseHit = { kind: "course"; key: string; course: Course };
type ResourceHit = {
  kind: "resource";
  key: string;
  course: Course;
  resource: Resource;
};
type Hit = CourseHit | ResourceHit;

/** A file from the index, which knows which course it belongs to. */
type IndexedFile = Resource & { course: string };

/** Rank a hit so an exact course code always beats a loose title match. */
function score(haystack: string[], q: string) {
  const needle = q.toLowerCase();
  let best = 0;
  for (const h of haystack) {
    const v = h.toLowerCase();
    const at = v.indexOf(needle);
    if (at === -1) continue;
    // Start index 0 beats a match at the end.
    let s = 100 - at;
    // Exact equality on the whole string is the strongest signal.
    if (v === needle) s += 200;
    // A hit inside a course code is worth more than one inside prose.
    if (v.replace(/\s+/g, "") === needle.replace(/\s+/g, "")) s += 150;
    if (s > best) best = s;
  }
  return best;
}

function search(
  q: string,
  uploaded: IndexedFile[]
): {
  courses: Course[];
  resources: ResourceHit[];
} {
  const trimmed = q.trim();
  if (!trimmed) return { courses: [], resources: [] };

  const courses: Course[] = [];
  const resources: ResourceHit[] = [];

  for (const course of COURSES) {
    const s = score(
      [course.code, course.title, course.lecturer, course.venue, course.program],
      trimmed
    );
    if (s > 0) courses.push(course);

    // The manifest holds the archive. The endpoint holds everything,
    // including what staff uploaded, and the ids overlap, so the uploaded
    // list is filtered against the manifest rather than replacing it.
    const files = [
      ...course.resources,
      ...uploaded.filter(
        (u) => u.course === course.code && !course.resources.some((r) => r.id === u.id)
      ),
    ];

    for (const r of files) {
      const rs = score([r.title, course.code, course.title, course.lecturer], trimmed);
      if (rs > 0) {
        resources.push({
          kind: "resource",
          key: r.id,
          course,
          resource: r,
        });
      }
    }
  }

  courses.sort(
    (a, b) =>
      score([b.code, b.title, b.lecturer], trimmed) -
      score([a.code, a.title, a.lecturer], trimmed)
  );
  resources.sort(
    (a, b) =>
      score([b.resource.title], trimmed) - score([a.resource.title], trimmed)
  );

  return { courses: courses.slice(0, 5), resources: resources.slice(0, 8) };
}

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // The file index, once. The manifest holds the archive in the bundle, so
  // the archive is searchable before this answers; the endpoint adds what
  // staff uploaded.
  const [uploaded, setUploaded] = React.useState<IndexedFile[]>([]);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/files")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: IndexedFile[]) => {
        if (alive && Array.isArray(rows)) setUploaded(rows);
      })
      .catch(() => {
        // The archive is still searchable. Nothing to say to the reader.
      });
    return () => {
      alive = false;
    };
  }, []);

  const { courses, resources } = React.useMemo(
    () => search(q, uploaded),
    [q, uploaded]
  );
  const total = courses.length + resources.length;

  // Flat list of navigable rows, so arrows move across group boundaries.
  const flat: Hit[] = React.useMemo(() => {
    const courseHits: Hit[] = courses.map((c) => ({
      kind: "course",
      key: c.slug,
      course: c,
    }));
    return [...courseHits, ...resources];
  }, [courses, resources]);

  React.useEffect(() => setCursor(0), [q]);

  // "/" focuses the field from anywhere, unless already typing somewhere.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes.
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = React.useCallback(
    (hit: Hit) => {
      setOpen(false);
      setQ("");
      inputRef.current?.blur();
      if (hit.kind === "course") {
        router.push(`/courses/${hit.course.slug}`);
      } else {
        // Land on the course and open the preview for that exact file.
        router.push(`/courses/${hit.course.slug}?r=${hit.resource.id}`);
      }
    },
    [router]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || flat.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (flat.length === 1) go(flat[0]);
        else if (flat.length > 1) setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[cursor]);
    }
  };

  const showPanel = open && q.trim().length > 0;
  let index = -1;

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* ---------- Field ---------- */}
      {/*
        Active state: the field lifts and brightens rather than only drawing a
        green outline. A border colour change is a weak signal on a dark ground
        and reads like a validation ring. Lift, an inner glow and a brighter
        surface say "this is the thing you are in" without the alarm.
      */}
      <div
        className={cn(
          "group relative flex items-center rounded-xl border bg-surface transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          open || q
            ? "border-accent/50 bg-surface-raised shadow-[0_0_0_3px_rgba(34,197,94,0.10),0_10px_30px_-12px_rgba(34,197,94,0.35)]"
            : "border-border hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <Search
          size={18}
          className={cn(
            "pointer-events-none absolute left-4 transition-all duration-200",
            open || q
              ? "scale-110 text-accent"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search courses, lecturers, or a file name"
          aria-label="Search courses and resources"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          className="h-14 w-full bg-transparent pl-12 pr-24 text-[15px] text-foreground placeholder:text-muted focus:outline-none"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {q ? (
            <button
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="pressable flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="hidden select-none rounded border border-border bg-surface-hover px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ---------- Results ---------- */}
      {showPanel && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-border-strong bg-surface-raised shadow-lift-hi"
        >
          {total === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-foreground">
                Nothing matches &ldquo;{q.trim()}&rdquo;
              </p>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Try a course code like CYB 305, a lecturer, or part of a file
                name.
              </p>
            </div>
          ) : (
            <div className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5">
              {courses.length > 0 && (
                <>
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Courses
                  </p>
                  {courses.map((c) => {
                    index += 1;
                    const i = index;
                    return (
                      <button
                        key={c.slug}
                        role="option"
                        aria-selected={i === cursor}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() =>
                          go({
                            kind: "course",
                            key: c.slug,
                            course: c,
                          })
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors",
                          i === cursor
                            ? "bg-accent/12 text-foreground"
                            : "text-muted-foreground hover:bg-surface-hover"
                        )}
                      >
                        <BookOpen
                          size={15}
                          className={cn(
                            "shrink-0",
                            i === cursor ? "text-accent" : "text-muted"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-foreground">
                            {c.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                            {c.lecturer} &middot; {c.venue}
                          </span>
                        </span>
                        <span className="tnum shrink-0 font-mono text-[11px] font-bold text-accent">
                          {c.code}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {resources.length > 0 && (
                <>
                  <p className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Files
                  </p>
                  {resources.map((hit) => {
                    index += 1;
                    const i = index;
                    const Icon = TYPE_ICON[hit.resource.type] ?? FileText;
                    return (
                      <button
                        key={hit.key}
                        role="option"
                        aria-selected={i === cursor}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(hit)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors",
                          i === cursor
                            ? "bg-accent/12 text-foreground"
                            : "text-muted-foreground hover:bg-surface-hover"
                        )}
                      >
                        <Icon
                          size={15}
                          className={cn(
                            "shrink-0",
                            i === cursor ? "text-accent" : "text-muted"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-foreground">
                            {hit.resource.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                            {hit.course.code} &middot; {hit.course.title}
                          </span>
                        </span>
                        <span className="shrink-0 rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                          {hit.resource.type}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Footer hint bar */}
          {total > 0 && (
            <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-surface px-1 py-px">↑</kbd>
                <kbd className="rounded border border-border bg-surface px-1 py-px">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <CornerDownLeft size={11} />
                open
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-surface px-1 py-px">esc</kbd>
                close
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}