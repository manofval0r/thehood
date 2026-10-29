"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { saveClassOverride, type BulletinActionState } from "@/app/admin/bulletin/actions";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { OutlookEvent } from "@/lib/bulletin-types";

function lagosLocal(iso: string): string {
  const instant = new Date(Date.parse(iso) + 60 * 60 * 1000);
  return instant.toISOString().slice(0, 16);
}

function display(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OverrideConflictDialog({
  event,
  onClose,
}: {
  event: OutlookEvent;
  onClose: () => void;
}) {
  const [action, setAction] = useState<"change" | "cancel">("change");
  const [state, formAction, pending] = useActionState<
    BulletinActionState,
    FormData
  >(saveClassOverride, {});
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useDialogFocus({
    open: true,
    panelRef,
    triggerRef: closeRef,
    onClose,
  });

  useEffect(() => {
    if (!state.done) return;
    router.refresh();
    onClose();
  }, [state.done, router, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close override dialog"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-background/75 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-title"
        tabIndex={-1}
        className="fixed inset-x-3 top-1/2 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-4xl -translate-y-1/2 overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-4 shadow-lift sm:inset-x-6 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              One occurrence only
            </p>
            <h2 id="override-title" className="mt-2 text-xl font-semibold text-foreground">
              Outlook and the bulletin will disagree
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Outlook remains visible as the source, but this super-admin decision
              becomes the cohort truth for this class. The original reminders are
              suppressed and a corrective alert is sent.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form action={formAction} className="mt-6">
          <input type="hidden" name="sourceEventId" value={event.externalId} />
          <input
            type="hidden"
            name="expectedSourceUpdatedAt"
            value={event.sourceUpdatedAt}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-lg border border-border bg-surface p-3">
              <input
                type="radio"
                name="action"
                value="change"
                checked={action === "change"}
                onChange={() => setAction("change")}
                className="accent-[var(--accent)]"
              />
              <span className="ml-2 text-[13px] font-semibold text-foreground">
                Change details
              </span>
            </label>
            <label className="cursor-pointer rounded-lg border border-border bg-surface p-3">
              <input
                type="radio"
                name="action"
                value="cancel"
                checked={action === "cancel"}
                onChange={() => setAction("cancel")}
                className="accent-[var(--accent)]"
              />
              <span className="ml-2 text-[13px] font-semibold text-foreground">
                Cancel this class
              </span>
            </label>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <section className="rounded-lg border border-border bg-background p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Outlook source
              </p>
              <dl className="mt-3 space-y-3 text-[12.5px]">
                <Diff label="Course" value={event.course ?? "Unassigned"} />
                <Diff label="When" value={`${display(event.startsAt)} – ${display(event.endsAt)}`} />
                <Diff label="Where" value={event.location ?? "No venue"} />
                <Diff label="Meeting" value={event.joinUrl ? "Link present" : "No link posted"} />
                <Diff label="Updated" value={display(event.sourceUpdatedAt)} />
              </dl>
            </section>
            <span className="hidden items-center text-accent lg:flex">
              <ArrowRight size={20} />
            </span>
            <section className="rounded-lg border border-accent/35 bg-accent/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Proposed cohort truth
              </p>
              {action === "cancel" ? (
                <div className="mt-5 flex items-center gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-foreground">
                  <AlertTriangle size={18} className="shrink-0 text-red-400" />
                  Cancelled. No start, break, or end reminders will be sent.
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  <Field label="New start" name="startsAt" type="datetime-local" defaultValue={lagosLocal(event.startsAt)} />
                  <Field label="New end" name="endsAt" type="datetime-local" defaultValue={lagosLocal(event.endsAt)} />
                  <Field label="Venue" name="location" defaultValue={event.location ?? ""} />
                  <Field label="Meeting link" name="meetingUrl" type="url" defaultValue={event.joinUrl ?? ""} />
                  <Field label="Student-facing note" name="note" placeholder="What should students know?" />
                </div>
              )}
            </section>
          </div>

          <label className="mt-4 block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Reason for the audit trail
            </span>
            <textarea
              name="reason"
              required
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent max-sm:text-base"
              placeholder="Why is Outlook being overridden?"
            />
          </label>

          {action === "cancel" && (
            <label className="mt-4 block rounded-md border border-red-500/30 bg-red-500/5 p-3">
              <span className="text-[12px] font-medium text-foreground">
                Type CANCEL to confirm
              </span>
              <input
                name="confirmation"
                autoComplete="off"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-red-400"
              />
            </label>
          )}

          <div className="mt-4 rounded-md border border-border bg-background p-3 text-[12px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Notification effect:</strong>{" "}
            the original occurrence reminders are suppressed. Students receive
            one immediate correction; a changed occurrence receives reminders at
            its replacement time. The override expires with this occurrence.
          </div>

          {state.error && (
            <p role="alert" className="mt-3 text-[12.5px] text-red-400">
              {state.error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="pressable min-h-11 rounded-md border border-border px-4 text-[13px] text-muted-foreground hover:text-foreground"
            >
              Keep Outlook
            </button>
            <button
              type="submit"
              disabled={pending}
              className="pressable min-h-11 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-50"
            >
              {pending ? "Applying" : action === "cancel" ? "Cancel occurrence" : "Publish change"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Diff({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent max-sm:h-11 max-sm:text-base"
      />
    </label>
  );
}
