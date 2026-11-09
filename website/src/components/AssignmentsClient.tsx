"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, Loader2 } from "lucide-react";
import { AssignmentList } from "@/components/AssignmentList";
import { AssignmentCard } from "@/components/AssignmentCard";
import { COURSES } from "@/lib/resources";
import type { Assignment } from "@/lib/assignments";

/**
 * The /assignments content, chosen on the client.
 *
 * The server route only renders the shell: reading searchParams under cache
 * components left the share branch pinned to the build-time fallback, and
 * the query never reached it. Reading the query here is deterministic — the
 * browser always knows its own URL — and the API call it drives hits the
 * same share endpoint the rest of the site uses.
 */
export function AssignmentsClient() {
  const searchParams = useSearchParams();
  const share = searchParams.get("share");

  if (!share) {
    return (
      <AssignmentList
        courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
      />
    );
  }
  return <SharedAssignment token={share} />;
}

function SharedAssignment({ token }: { token: string }) {
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    void fetch(`/api/assignments?share_token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        return (await res.json()) as Assignment;
      })
      .then((row) => {
        if (live) setAssignment(row);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [token]);

  if (failed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-10 text-center">
        <Inbox size={32} className="mx-auto text-muted" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
          Assignment not found
        </h1>
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

  if (!assignment) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true">
        <Loader2 size={22} className="animate-spin text-muted" />
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
