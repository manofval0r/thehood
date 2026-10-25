import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AssessmentList } from "@/components/AssessmentList";
import { COURSES } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Assessments · Cybersecurity 300L",
  description:
    "Track your tests, exams and assignments with live countdowns and reminders.",
};

/**
 * Assessments.
 *
 * Students add their own tests, exams and assignments and watch live
 * countdowns. Reminders can be set for each one. Staff see the same page
 * but cannot add through it — the staff area manages course material, not
 * student deadlines.
 */

export default function AssessmentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl mb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Assessments
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Add your tests, exams and assignments and watch the countdown tick
          down. Set a reminder for each one so nothing catches you by
          surprise.
        </p>
      </header>

      <Suspense fallback={<AssessmentsSkeleton />}>
        <AssessmentsArea />
      </Suspense>
    </div>
  );
}

function AssessmentsSkeleton() {
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

async function AssessmentsArea() {
  await connection();

  return (
    <AssessmentList
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
