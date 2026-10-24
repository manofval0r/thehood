"use client";

import { ChevronDown } from "lucide-react";

export interface CourseOption {
  code: string;
  title: string;
}

/**
 * The one place a course is chosen.
 *
 * The code alone was the label on the old file and video pages, which meant
 * somebody had to know that GST 312 was Peace and Conflict Resolution before
 * they could put a file in the right place. The name is now the label and the
 * code is the small print, so the course is obvious before anything is
 * uploaded and there is one selected course shared by both kinds of resource.
 */
export default function CoursePicker({
  courses,
  value,
  onChange,
}: {
  courses: CourseOption[];
  value: string;
  onChange: (code: string) => void;
}) {
  const current = courses.find((c) => c.code === value) ?? courses[0];
  if (!current) return null;

  return (
    <div className="mt-6 rounded-lg border border-border bg-background p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-4">
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">
          Working on
        </p>
        <p className="mt-1 text-[14px] font-semibold leading-snug text-foreground">
          {current.title}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">{current.code}</p>
      </div>

      <label className="mt-3 block sm:mt-0 sm:w-72 sm:shrink-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          Change course
        </span>
        <span className="relative mt-1 block">
          <select
            value={current.code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-md border border-border bg-surface py-2 pl-3 pr-9 text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
          >
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </span>
      </label>
    </div>
  );
}
