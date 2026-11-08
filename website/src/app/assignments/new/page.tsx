"use client";
import { Suspense } from "react";
import { AssignmentForm } from "@/components/AssignmentForm";
import { COURSES } from "@/lib/resources";

export default function NewAssignmentPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<NewAssignmentSkeleton />}>
        <NewAssignmentForm />
      </Suspense>
    </div>
  );
}

function NewAssignmentSkeleton() {
  return (
    <div className="mt-10 space-y-3">
      <div className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="h-4 w-1/3 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="h-4 w-full animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

function NewAssignmentForm() {
  return (
    <AssignmentForm
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
      onSubmit={() => {}}
      onClose={() => {}}
    />
  );
}
