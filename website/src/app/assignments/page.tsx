import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
      <Suspense fallback={<AssignmentsSkeleton />}>
        <AssignmentsArea searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function AssignmentsSkeleton() {
  return (
    <div className="space-y-6 pt-4" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
        <div className="h-9 w-44 animate-pulse rounded bg-surface-raised" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
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
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-10 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Assignment not found</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            The share link is invalid or has expired.
          </p>
          <Link
            href="/assignments"
            className="pressable mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            All assignments
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-xl">
        <Link
          href="/assignments"
          className="pressable mb-4 inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All assignments
        </Link>
        <AssignmentCard
          assessment={assignment}
          now={new Date()}
          onDelete={() => {}}
          onEdit={() => {}}
          onToggleDone={() => {}}
          readOnly
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
