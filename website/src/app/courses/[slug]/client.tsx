"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, User, Calendar, Clock, Mail } from "lucide-react";
import type { Course } from "@/lib/resources";
import { repAddress, repFirstName } from "@/lib/contact";
import CourseWorkspace from "@/components/CourseWorkspace";
import VideoLibrary from "@/components/VideoLibrary";

/**
 * The course page.
 *
 * The header says when the course meets and who teaches it, and who the
 * course rep is. Everything else is the workspace, which is the browser for
 * the course's material.
 */
export default function CourseClient({
  course,
  resources,
  folders,
  videos,
  thumbBase,
}: {
  course: Course;
  resources: {
    id: string;
    title: string;
    type: string;
    url: string;
    size?: string;
    folder: string | null;
  }[];
  folders: string[];
  videos: {
    id: string;
    title: string;
    youtube_id: string;
    note: string | null;
    thumb_path: string | null;
  }[];
  thumbBase: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* ---------- Header ---------- */}
      <section className="rise pb-10 pt-12">
        <Link
          href="/"
          className="pressable mb-8 inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground max-sm:min-h-11"
        >
          <ArrowLeft size={14} />
          All courses
        </Link>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,30%)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded bg-accent/10 px-2.5 py-1 font-mono text-[12px] font-bold tracking-[0.06em] text-accent">
              {course.code}
            </span>
            <h1 className="mt-5 max-w-2xl text-[clamp(1.875rem,4.5vw,3rem)] font-bold leading-[1.06] tracking-[-0.02em] text-foreground">
              {course.title}
            </h1>

            {/* When it meets */}
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-2 rounded-md bg-surface px-3 py-2 text-[14px] font-semibold text-foreground">
                <Clock size={14} className="text-accent" />
                {course.day}
              </span>
              <span className="tnum rounded-md bg-surface px-3 py-2 text-[14px] text-muted-foreground">
                {course.time}
              </span>
            </div>
          </div>

          {/* Facts panel: one column, label over value, rows divided not boxed. */}
          <dl className="divide-y divide-border self-start rounded-lg border border-border bg-surface">
            {[
              { Icon: User, label: "Lecturer", value: course.lecturer },
              { Icon: MapPin, label: "Venue", value: course.venue },
              { Icon: Calendar, label: "Programme", value: course.program },
              { Icon: Clock, label: "Load", value: `${course.units} units` },
            ].map(({ Icon, label, value }) => (
              <div
                key={label}
                className="row-hover flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <dt className="flex shrink-0 items-center gap-2 text-[12px] text-muted">
                  <Icon size={13} className="text-muted" />
                  {label}
                </dt>
                <dd className="text-right text-[13px] font-medium leading-snug text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* One action, placed under the facts it refers to. Nothing renders
            unless an address exists AND a lecturer has been assigned, so
            there is never a mail link that goes nowhere and never a button
            inviting you to write to "Pending". */}
        {repAddress(course.code) && repFirstName(course.lecturer) && (
          <a
            href={`mailto:${repAddress(course.code)}?subject=${encodeURIComponent(
              `${course.code} - ${course.title}`
            )}`}
            className="pressable mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11"
          >
            <Mail size={14} className="text-accent" />
            Contact {repFirstName(course.lecturer)}, the course rep
          </a>
        )}
      </section>

      {/* ---------- Resources ---------- */}
      <CourseWorkspace
        courseCode={course.code}
        courseSlug={course.slug}
        files={resources}
        folders={folders}
      />

      {/* ---------- Videos ---------- */}
      <VideoLibrary videos={videos} thumbBase={thumbBase} />
    </div>
  );
}
