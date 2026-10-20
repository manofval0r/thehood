"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, MapPin, User, Calendar, Clock, Mail } from "lucide-react";
import type { Course, Resource } from "@/lib/resources";
import { resourceUrl } from "@/lib/resources";
import { repAddress, repFirstName } from "@/lib/contact";
import ResourceCard from "@/components/ResourceCard";
import ResourceModal from "@/components/ResourceModal";
import BatchDownload from "@/components/BatchDownload";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "PDF", "Slides", "Sheet", "Document"] as const;

const FILTER_TYPE: Record<(typeof FILTERS)[number], string | null> = {
  All: null,
  PDF: "pdf",
  Slides: "pptx",
  Sheet: "xlsx",
  Document: "doc",
};

export default function CourseClient({
  course,
  resources,
}: {
  course: Course;
  resources: Resource[];
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const params = useSearchParams();

  // Search can deep-link straight to a file: /courses/<slug>?r=<resourceId>
  useEffect(() => {
    const wanted = params.get("r");
    if (!wanted) return;
    if (resources.some((r) => r.id === wanted)) setPreviewId(wanted);
  }, [params, resources]);

  const want = FILTER_TYPE[filter];
  const visible = want
    ? resources.filter((r) => r.type === want)
    : resources;

  // Only offer filters that would actually show something.
  const available = FILTERS.filter((f) => {
    const t = FILTER_TYPE[f];
    return !t || resources.some((r) => r.type === t);
  });

  const previewResource = previewId
    ? resources.find((r) => r.id === previewId)
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* ---------- Header ---------- */}
      <section className="rise pb-10 pt-12">
        <Link
          href="/"
          className="pressable mb-8 inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                <dt className="flex shrink-0 items-center gap-2 text-[12px] text-muted-foreground">
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
            className="pressable mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover"
          >
            <Mail size={14} className="text-accent" />
            Contact {repFirstName(course.lecturer)}, the course rep
          </a>
        )}
      </section>

      {/* ---------- Resources ---------- */}
      <section className="pb-16">
        <div className="flex flex-col gap-5 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Resources
            {resources.length > 0 && (
              <span className="tnum ml-2.5 text-lg font-normal text-muted-foreground">
                {resources.length}
              </span>
            )}
          </h2>

          {available.length > 1 && (
            <div
              role="tablist"
              aria-label="Filter resources by type"
              className="flex flex-wrap gap-1.5"
            >
              {available.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "pressable rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    filter === f
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-12 text-center">
            <FileText size={36} className="mx-auto text-muted" strokeWidth={1.5} />
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">
              Nothing uploaded yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              {course.code} has no {filter === "All" ? "files" : filter.toLowerCase() + " files"} on
              the server. Lecture notes for this course appear here as soon as the
              lecturer adds them.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r, i) => (
              <ResourceCard
                key={r.id}
                resource={r}
                href={resourceUrl(r.url)}
                onPreview={setPreviewId}
                index={i}
              />
            ))}
          </div>
        )}

        {resources.length > 0 && (
          <div className="mt-14">
            <BatchDownload resources={resources} courseCode={course.code} />
          </div>
        )}
      </section>

      {previewResource && (
        <ResourceModal
          open
          onOpenChange={(o) => !o && setPreviewId(null)}
          resource={previewResource}
        />
      )}
    </div>
  );
}