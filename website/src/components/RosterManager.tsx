"use client";

import { useActionState, useState } from "react";
import { addToRoster, removeFromRoster, type RosterState } from "@/app/admin/actions";

/**
 * The roll.
 *
 * Names live in the database, not in the repository. This site is public, and
 * a student list committed to git is a student list published. The roll is
 * entered here, behind the staff code, and read by the server only.
 *
 * Students are pasted in as "matric, name" a line each, because a class list
 * arrives in a spreadsheet or a message and retyping it one row at a time is
 * the kind of job that gets done wrong.
 */

export interface RosterStudentView {
  matric: string;
  name: string;
  course: string;
}

export interface CourseOption {
  code: string;
  title: string;
}

export function RosterManager({
  students,
  courses,
}: {
  students: RosterStudentView[];
  courses: CourseOption[];
}) {
  const [course, setCourse] = useState(courses[0]?.code ?? "");
  const [state, formAction, pending] = useActionState<RosterState, FormData>(
    addToRoster,
    {}
  );

  const onRoll = students.filter((s) => s.course === course);

  return (
    <section className="mt-12">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        The roll
      </h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        Paste the students as one "matric, name" per line. A line without a
        comma is ignored rather than guessed at.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {courses.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCourse(c.code)}
            className={
              "pressable inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium max-sm:min-h-11 max-sm:px-3 " +
              (c.code === course
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c.code}
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-4 max-w-2xl">
        <input type="hidden" name="course" value={course} />
        <label
          htmlFor="students"
          className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
        >
          {course} students
        </label>
        <textarea
          id="students"
          name="students"
          rows={5}
          spellCheck={false}
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
          placeholder={"CSC/2021/001, Ada Obi\nCSC/2021/002, Chidi Eze"}
        />

        {state.error ? (
          <p role="alert" className="mt-2 text-[12.5px] text-foreground">
            {state.error}
          </p>
        ) : null}
        {typeof state.added === "number" ? (
          <p className="mt-2 text-[12.5px] text-accent">
            {state.added} {state.added === 1 ? "student" : "students"} added.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !course}
          className="pressable mt-3 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60 max-sm:min-h-11 max-sm:text-base"
        >
          {pending ? "Adding" : "Add to the roll"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
          {onRoll.length} on the roll
        </h3>
        {onRoll.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Nobody is on the roll for {course} yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {onRoll.map((s) => (
              <li
                key={s.matric}
                className="flex items-center gap-3 py-2 text-[13px]"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {s.name}
                </span>
                <span className="font-mono text-[11.5px] text-muted">
                  {s.matric}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromRoster(s.matric)}
                  className="pressable rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
