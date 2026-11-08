import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AssignmentList } from "@/components/AssignmentList";
import { AssignmentCard } from "@/components/AssignmentCard";
import { getAssignmentByShareToken } from "@/lib/assignments-server";
import { COURSES } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Assignments · Cybersecurity 300L",
  description:
    "Course assignments with countdowns, resources, reminders and submission details.",
};

export default function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl mb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Assignments
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Course assignments with countdowns, resources, reminders and submission details.
        </p>
      </header>

      <Suspense fallback={<AssignmentsSkeleton />}>
        <AssignmentsArea searchParams={searchParams} />
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

async function AssignmentsArea({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const shareTokenRaw = sp.share_token;
  const shareToken =
    typeof shareTokenRaw === "string"
      ? shareTokenRaw
      : Array.isArray(shareTokenRaw)
        ? shareTokenRaw[0]
        : undefined;

  if (shareToken) {
    const assignment = await getAssignmentByShareToken(shareToken);
    if (!assignment) {
      return (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground">Assignment not found</h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            The share link is invalid or has expired.
          </p>
        </div>
      );
    }
    return (
      <div className="mt-6">
        <AssignmentCard
          assessment={assignment}
          now={new Date()}
          onDelete={() => {}}
          onEdit={() => {}}
          onToggleDone={() => {}}
        />
      </div>
    );
  }

  return (
    <AssignmentList
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
