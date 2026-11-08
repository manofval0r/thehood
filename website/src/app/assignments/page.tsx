import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AssignmentList } from "@/components/AssignmentList";
import { COURSES } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Assignments · Cybersecurity 300L",
  description:
    "Course assignments with countdowns, resources, reminders and submission details.",
};

/**
 * Assignments.
 *
 * Staff create assignments for their courses: group or individual, with a
 * due date, submission method, notes, resources and an optional in-class
 * event. Students see the same list read-only, with countdowns and filters.
 */

export default function AssignmentsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl mb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Assignments
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Course assignments with countdowns, resources and reminders. Staff
          create them; students see them.
        </p>
      </header>

      <Suspense fallback={<AssignmentsSkeleton />}>
        <AssignmentsArea />
      </Suspense>
    </div>
  );
}

function AssignmentsSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}

async function AssignmentsArea() {
  await connection();

  return (
    <AssignmentList
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
