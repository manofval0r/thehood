import type { Metadata } from "next";
import { Suspense } from "react";
import { AssignmentsClient } from "@/components/AssignmentsClient";

export const metadata: Metadata = {
  title: "Assignments · Cybersecurity 300L",
  description:
    "Course assignments with countdowns, resources, reminders and submission details.",
};

/**
 * The /assignments page is a shell around a client island. The share branch
 * and the list are both rendered client-side from the browser's own URL —
 * see AssignmentsClient for why the server could not do it reliably under
 * cache components.
 */
export default function AssignmentsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
      <Suspense fallback={<AssignmentsSkeleton />}>
        <AssignmentsClient />
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
