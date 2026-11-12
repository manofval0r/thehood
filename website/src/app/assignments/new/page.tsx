"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { AssignmentForm } from "@/components/AssignmentForm";
import { useStaffSession } from "@/components/StaffSession";
import { COURSES } from "@/lib/resources";
import type {
  Assignment,
  AssignmentType,
  SubmitMethod,
  NotificationFrequency,
} from "@/lib/assignments";

/**
 * Set an assignment / amend one that exists.
 *
 * With ?edit=<id> the form opens prefilled from the API and submits as a
 * PATCH; otherwise it creates. Staff only: the API enforces it too, but a
 * page that lets anyone type a whole assignment and then rejects them is a
 * rude page.
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
      <NewAssignmentForm />
    </Suspense>
  );
}

function NewAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const defaultCourseCode = searchParams.get("course") ?? undefined;

  const { session, refresh } = useStaffSession();
  const [checked, setChecked] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(Boolean(editId));
  const [existing, setExisting] = React.useState<Assignment | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let live = true;
    void refresh().finally(() => {
      if (live) setChecked(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = editId
        ? await fetch(`/api/assignments?id=${encodeURIComponent(editId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not save the assignment");
      }
      router.push("/assignments");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the assignment");
      setBusy(false);
    }
  };

  const busyOverlay = (
    <div className="flex min-h-[40vh] items-center justify-center" aria-hidden="true">
      <Loader2 size={20} className="animate-spin text-muted" />
    </div>
  );

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
        <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.2em] text-muted sm:inline">
          The Hood · Dept. of Cybersecurity
        </span>
      </div>

      {!checked ? (
        busyOverlay
      ) : !session || session.isAdmin !== true ? (
        <div className="rounded-2xl border border-border-strong bg-surface-raised p-10 text-center">
          <ShieldAlert size={36} className="mx-auto text-amber" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Staff only
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            Setting assignments is a staff action. Sign in to the staff area,
            then come back here and this page will behave.
          </p>
          <Link
            href="/admin"
            className="pressable mt-5 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Staff sign in
          </Link>
        </div>
      ) : loadingEdit ? (
        busyOverlay
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
