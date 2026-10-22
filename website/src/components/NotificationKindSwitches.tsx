"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { KIND_HELP, KIND_LABEL, KINDS } from "@/lib/notification-kinds";
import { setNotificationKind } from "@/app/admin/actions";

/**
 * What the site is allowed to tell anybody.
 *
 * A reader chooses what they want to be told about, in the bell. This is
 * the other half: what the site is allowed to tell anybody. It is for the
 * case where a kind is wrong for a while, because the timetable changed or
 * the calendar is being rebuilt, and turning it off for everybody is
 * better than turning it off for a hundred people one at a time.
 *
 * A message a super admin writes by hand is not affected. The point of
 * those is that they are not a kind anybody can mute.
 */
function Switch({
  kind,
  on,
}: {
  kind: (typeof KINDS)[number];
  on: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium leading-snug text-foreground">
          {KIND_LABEL[kind]}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {KIND_HELP[kind]}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setNote(null);
            try {
              await setNotificationKind(kind, !on);
            } catch (error) {
              setNote(
                error instanceof Error
                  ? error.message
                  : "It could not be changed."
              );
            } finally {
              setBusy(false);
            }
          }}
          aria-pressed={on}
          className={
            "pressable inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50 " +
            (on
              ? "border-accent/40 bg-accent/10 text-accent hover:border-accent/60"
              : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
          }
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <span
              aria-hidden="true"
              className={
                "h-2 w-2 rounded-full " +
                (on ? "bg-accent" : "bg-muted-foreground/40")
              }
            />
          )}
          {busy ? "Changing" : on ? "Sent to everybody" : "Switched off"}
        </button>
        {note && (
          <span role="status" className="max-w-[15rem] text-right text-[11px] leading-snug text-muted-foreground">
            {note}
          </span>
        )}
      </div>
    </li>
  );
}

export default function NotificationKindSwitches({
  disabled,
}: {
  disabled: string[];
}) {
  return (
    <div className="mt-10">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        What the site is allowed to send
      </h2>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        A reader chooses what they want to be told about, in the bell. This
        is the other half: what the site is allowed to tell anybody. Switch
        a kind off and nobody is interrupted by it, whatever they asked
        for.
      </p>

      <ul className="mt-5 space-y-2.5">
        {KINDS.map((kind) => (
          <Switch key={kind} kind={kind} on={!disabled.includes(kind)} />
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-muted">
        A message a super admin writes by hand is not affected by this. The
        point of those is that they are not a kind anybody can mute, and a
        class that is not running gets through whatever is switched off
        here.
      </p>
    </div>
  );
}
