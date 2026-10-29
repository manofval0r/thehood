"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarSync, Pin, Radio, RotateCcw, Send } from "lucide-react";
import CoursePicker from "@/components/CoursePicker";
import OverrideConflictDialog from "@/components/OverrideConflictDialog";
import {
  archiveBulletinItem,
  publishBulletinItem,
  restoreClassOverride,
  saveBulletinDraft,
  syncOutlookNow,
  toggleBulletinPin,
  type BulletinActionState,
} from "@/app/admin/bulletin/actions";
import type { BulletinAdminItem } from "@/lib/bulletin-admin";
import type {
  ClassOccurrenceOverride,
  OutlookEvent,
  RsvpResponse,
} from "@/lib/bulletin-types";

interface Props {
  me: { id: string; name: string; role: "super" | "admin" };
  courses: { code: string; title: string }[];
  items: BulletinAdminItem[];
  outlookEvents: OutlookEvent[];
  overrides: ClassOccurrenceOverride[];
  connection: {
    configured: boolean;
    connected: boolean;
    accountEmail: string | null;
    status: string;
    syncedAt: string | null;
    lastError: string | null;
  };
  rsvpNames: Record<
    string,
    { matric: string; name: string; response: RsvpResponse }[]
  >;
}

export default function BulletinManager(props: Props) {
  const [state, formAction, saving] = useActionState<
    BulletinActionState,
    FormData
  >(saveBulletinDraft, {});
  const [course, setCourse] = useState(props.courses[0]?.code ?? "");
  const [selectedEvent, setSelectedEvent] = useState<OutlookEvent | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const superUser = props.me.role === "super";

  const run = (work: () => Promise<void>) =>
    startTransition(async () => {
      await work();
      router.refresh();
    });

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-xl border border-border-strong bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              Managed source
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-foreground">
              University Outlook calendar
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {props.connection.connected
                ? `${props.connection.accountEmail ?? "Connected account"} · ${props.connection.status}`
                : props.connection.configured
                  ? "No managed account is connected."
                  : "OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET are not configured."}
            </p>
            {props.connection.syncedAt && (
              <p className="mt-1 text-[11px] text-muted">
                Last synced {new Date(props.connection.syncedAt).toLocaleString("en-GB")}
              </p>
            )}
            {props.connection.lastError && (
              <p className="mt-2 text-[12px] text-red-400">{props.connection.lastError}</p>
            )}
          </div>
          {superUser && (
            <div className="flex flex-wrap gap-2">
              {props.connection.configured && (
                <a
                  href="/api/calendar/outlook/authorize"
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-[12px] font-medium text-foreground hover:border-border-strong"
                >
                  <CalendarSync size={14} />
                  {props.connection.connected ? "Replace connection" : "Connect Outlook"}
                </a>
              )}
              {props.connection.connected && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(syncOutlookNow)}
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-3 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Sync now
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Staff draft
        </p>
        <h2 className="mt-1 text-[15px] font-semibold text-foreground">
          Put something on the board
        </h2>
        <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="course" value={course} />
          <label className="sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Title</span>
            <input name="title" required className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-accent" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Details</span>
            <textarea name="body" required rows={4} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-accent" />
          </label>
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Kind</span>
            <select name="kind" className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground">
              <option value="notice">Notice</option>
              <option value="event">Event</option>
              <option value="alert">Alert</option>
              <option value="deadline">Deadline</option>
              <option value="resource">Resource update</option>
            </select>
          </label>
          <CoursePicker courses={props.courses} value={course} onChange={setCourse} />
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Starts</span>
            <input type="datetime-local" name="startsAt" className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Ends</span>
            <input type="datetime-local" name="endsAt" className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Venue</span>
            <input name="location" className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">External or meeting link</span>
            <input type="url" name="meetingUrl" className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground" />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-4">
            <Check name="rsvpEnabled" label="Collect RSVP" />
            {superUser && <Check name="urgent" label="Urgent" />}
            {superUser && <Check name="pinned" label="Pin to top" />}
          </div>
          {state.error && <p role="alert" className="sm:col-span-2 text-[12.5px] text-red-400">{state.error}</p>}
          {state.done && <p role="status" className="sm:col-span-2 text-[12.5px] text-accent">{state.done}</p>}
          <button disabled={saving} className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-50 sm:col-span-2 sm:justify-self-start">
            <Send size={14} /> {saving ? "Saving" : "Save draft"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Board items</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Drafts wait for a super admin. Published items remain auditable after archive.</p>
          </div>
          <span className="tnum text-[12px] text-muted">{props.items.length}</span>
        </div>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {props.items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-foreground">{item.title}</span>
                  <span className="block text-[11.5px] text-muted">{item.status} · {item.kind}{item.course ? ` · ${item.course}` : ""}{item.createdByName ? ` · by ${item.createdByName}` : ""}</span>
                </span>
                {item.pinned && <Pin size={13} className="text-accent" />}
                {superUser && item.status === "draft" && (
                  <button type="button" disabled={pending} onClick={() => run(() => publishBulletinItem(item.id))} className="pressable min-h-11 rounded-md px-3 text-[12px] text-accent hover:bg-accent/10">Publish</button>
                )}
                {superUser && item.status === "published" && (
                  <>
                    <button type="button" disabled={pending} onClick={() => run(() => toggleBulletinPin(item.id, !item.pinned))} className="pressable min-h-11 rounded-md px-3 text-[12px] text-muted hover:text-foreground">{item.pinned ? "Unpin" : "Pin"}</button>
                    <button type="button" disabled={pending} onClick={() => run(() => archiveBulletinItem(item.id))} className="pressable min-h-11 rounded-md px-3 text-[12px] text-muted hover:text-foreground">Archive</button>
                  </>
                )}
              </div>
              {superUser && props.rsvpNames[item.id]?.length > 0 && (
                <p className="mt-2 text-[11.5px] text-muted">Responses: {props.rsvpNames[item.id].map((row) => `${row.name} (${row.response.replace("_", " ")})`).join(", ")}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {superUser && (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Upcoming Outlook occurrences</h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Override only when the cohort truth must differ from Outlook.</p>
            </div>
            <Radio size={16} className="text-accent" />
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {props.outlookEvents.map((event) => (
              <li key={event.externalId} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-[13.5px] font-semibold text-foreground">{event.subject}</p>
                <p className="mt-1 text-[11.5px] text-muted">{event.course ?? "Unassigned"} · {new Date(event.startsAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">{event.location ?? "No venue"} · {event.joinUrl ? "meeting link present" : "link not posted"}</p>
                <button type="button" onClick={() => setSelectedEvent(event)} className="pressable mt-3 min-h-11 rounded-md border border-border px-3 text-[12px] font-medium text-foreground hover:border-accent">Review override</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {superUser && props.overrides.some((entry) => entry.status === "active") && (
        <section>
          <h2 className="text-[15px] font-semibold text-foreground">Active overrides</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {props.overrides.filter((entry) => entry.status === "active").map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1 text-[13px] text-foreground">{entry.course} · {entry.action} <span className="text-muted">({entry.reason})</span></span>
                <button type="button" disabled={pending} onClick={() => run(() => restoreClassOverride(entry.id, entry.updatedAt))} className="pressable min-h-11 rounded-md border border-border px-3 text-[12px] text-foreground hover:border-accent">Restore Outlook</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedEvent && (
        <OverrideConflictDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

function Check({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[12.5px] text-foreground">
      <input type="checkbox" name={name} className="h-4 w-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}
