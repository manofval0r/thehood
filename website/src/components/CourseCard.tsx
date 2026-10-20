import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Course } from "@/lib/resources";
import AppleCard from "@/components/AppleCard";
import { cn } from "@/lib/utils";

export function CourseCard({
  course,
  index = 0,
  fileCount,
}: {
  course: Course;
  index?: number;
  /** How many files the index holds for this course. */
  fileCount?: number;
}) {
  // The count comes from the index when there is one, so a file staff
  // uploaded is counted on the card straight away.
  const count = fileCount ?? course.resources.length;
  const hasFiles = count > 0;

  return (
    <AppleCard maxTilt={6} className="h-full">
      <Link
        href={`/courses/${course.slug}`}
        className={cn(
          // No overflow-hidden here: it would compute transform-style to
          // flat and every translateZ layer would collapse onto the card.
          "card-tilt settle relative block h-full rounded-lg border border-border bg-surface",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        )}
        style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
      >
        <span className="card-cast" aria-hidden="true" />
        <span className="card-accent-glow" aria-hidden="true" />
        <span className="card-bevel" aria-hidden="true" />

        <div className="relative flex h-full flex-col p-5">
          {/* Top row */}
          <div
            className="card-depth flex items-start justify-between gap-3"
            style={{ "--depth": "16px" } as React.CSSProperties}
          >
            <span className="rounded bg-accent/10 px-2 py-1 font-mono text-[11px] font-bold tracking-[0.04em] text-accent">
              {course.code}
            </span>
            <ArrowUpRight
              size={16}
              className="card-depth mt-0.5 shrink-0 text-muted"
              style={{ "--depth": "30px" } as React.CSSProperties}
            />
          </div>

          {/* Title carries the most depth, so it appears to lift toward you. */}
          <h3
            className="card-depth mt-4 text-[15px] font-semibold leading-snug text-foreground"
            style={{ "--depth": "40px" } as React.CSSProperties}
          >
            {course.title}
          </h3>

          <p
            className="card-depth mt-2 text-[13px] leading-relaxed text-muted-foreground"
            style={{ "--depth": "24px" } as React.CSSProperties}
          >
            {course.lecturer}
          </p>

          {/* Footer rail */}
          <div
            className="card-depth mt-auto flex items-center justify-between border-t border-border pt-4 text-[12px]"
            style={{ "--depth": "10px" } as React.CSSProperties}
          >
            <span className="tnum text-muted-foreground">{course.units} units</span>
            {hasFiles ? (
              <span className="tnum font-medium text-foreground">
                {count} file{count === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-muted">No files yet</span>
            )}
          </div>
        </div>
      </Link>
    </AppleCard>
  );
}