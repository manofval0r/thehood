"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { AssignmentForm } from "@/components/AssignmentForm";
import { useStaffSession } from "@/components/StaffSession";
import { COURSES } from "@/lib/resources";
import { ownedTokenFor, recordOwnerToken } from "@/lib/owner-tokens";
import type {
  Assignment,
  AssignmentType,
  SubmitMethod,
  NotificationFrequency,
} from "@/lib/assignments";

/**
 * Set an assignment.
 *
 * Creation is open to anyone: no sign-in, no roster check. Whoever creates
 * an assignment receives an owner token in the response and keeps it in
 * localStorage, which is what lets them edit or delete it later. Staff can
 * moderate anything. With ?edit=<id> the form opens prefilled for that
 * assignment; only staff or the browser holding its owner token may save.
 */
export default function NewAssignmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      }
    >
      <ComposeAssignment />
    </Suspense>
  );
}

function ComposeAssignment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const defaultCourseCode = searchParams.get("course") ?? undefined;

  const { session } = useStaffSession();
  const isStaff = session?.isAdmin === true;

  const [loadingEdit, setLoadingEdit] = React.useState(Boolean(editId));
  const [existing, setExisting] = React.useState<Assignment | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const ownToken = editId ? ownedTokenFor(editId) : null;
  const canEdit = !editId || isStaff || Boolean(ownToken);

  React.useEffect(() => {
    if (!editId) return;
    let live = true;
    void fetch(`/api/assignments?id=${encodeURIComponent(editId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("That assignment could not be loaded");
        return (await res.json()) as Assignment;
      })
      .then((a) => {
        if (live) {
          setExisting(a);
          setLoadingEdit(false);
        }
      })
      .catch((e: unknown) => {
        if (live) {
          setError(e instanceof Error ? e.message : "That assignment could not be loaded");
          setLoadingEdit(false);
        }
      });
    return () => {
      live = false;
    };
  }, [editId]);

  const submit = async (data: {
    courseCode: string;
    courseTitle: string;
    title: string;
    type: AssignmentType;
    dueAt: string;
    submitMethod: SubmitMethod;
    submitDetail: string;
    notes: string;
    eventTitle: string;
    eventAt: string | null;
    notificationFrequency: NotificationFrequency;
    customReminderHours: number | null;
    resources: { type: "youtube" | "upload"; url: string; title: string }[];
    reminders: { offset_hours: number }[];
  }) => {
    setBusy(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ownToken) headers["x-owner-token"] = ownToken;

      const res = editId
        ? await fetch(`/api/assignments?id=${encodeURIComponent(editId)}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(data),
          })
        : await fetch("/api/assignments", {
            method: "POST",
            headers,
            body: JSON.stringify(data),
          });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not save the assignment");
      }

      if (!editId) {
        const json = (await res.json().catch(() => null)) as {
          assignment?: Assignment;
          ownerToken?: string;
        } | null;
        if (json?.ownerToken && json?.assignment?.id) {
          recordOwnerToken(json.assignment.id, json.ownerToken);
        }
      }

      router.push("/assignments");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the assignment");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Console chrome. */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/assignments"
          className="pressable inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Assignments
        </Link>
        <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted">
          The Hood · Dept. of Cybersecurity
        </span>
      </div>

      {editId && !canEdit ? (
        <div className="rounded-2xl border border-border-strong bg-surface-raised p-10 text-center">
          <ShieldAlert size={36} className="mx-auto text-amber" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Not yours to edit
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            Assignments are set by whoever creates them. You can only change
            the ones this browser set, or any of them as staff.
          </p>
          <Link
            href="/assignments"
            className="pressable mt-5 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Back to assignments
          </Link>
        </div>
      ) : editId && loadingEdit ? (
        <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true">
          <Loader2 size={20} className="animate-spin text-muted" />
        </div>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-md border border-red/40 bg-red/10 px-4 py-3 text-[12.5px] font-medium text-red"
            >
              {error}
            </p>
          )}
          <AssignmentForm
            bare
            assessment={
              existing
                ? {
                    id: existing.id,
                    course_code: existing.course_code,
                    course_title: existing.course_title,
                    title: existing.title,
                    type: existing.type,
                    due_at: existing.due_at,
                    submit_method: existing.submit_method,
                    submit_detail: existing.submit_detail,
                    notes: existing.notes,
                    event_title: existing.event_title,
                    event_at: existing.event_at,
                    notification_frequency: existing.notification_frequency,
                    custom_reminder_hours: existing.custom_reminder_hours,
                    resources: existing.resources,
                    reminders:
                      existing.reminders?.map((r) => ({
                        offset_hours: r.offset_hours,
                      })) ?? [],
                    share_token: existing.share_token,
                  }
                : undefined
            }
            courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
            defaultCourseCode={defaultCourseCode}
            onSubmit={submit}
            onClose={() => router.push("/assignments")}
            busy={busy}
          />
        </>
      )}
    </div>
  );
}
