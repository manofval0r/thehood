"use client";

import * as React from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  CATALOGUE,
  type CatalogueId,
} from "@/lib/notification-catalogue";
import { KIND_LABEL } from "@/lib/notification-kinds";
import { deviceId } from "@/lib/notifications-client";
import { sendNotificationTest } from "@/app/admin/actions";

/**
 * What can be told about, and a button to try each one.
 *
 * The bell's settings say what a reader can turn on. This says what the
 * site actually sends, and every one of them can be sent to this device
 * on demand.
 *
 * A test is the only way to know that a push works. The push keys, the
 * service worker and the browser's own permission are three things that
 * can each be wrong on their own, and none of them can be checked by
 * looking at the server. So each row sends the real thing, to the device
 * that pressed the button, and it comes even in the quiet hours, because a
 * test that does not arrive because it is the middle of the night says
 * nothing about whether the keys work.
 */
function TestButton({ id, label }: { id: CatalogueId; label: string }) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setResult(null);
          try {
            const answer = await sendNotificationTest(id, deviceId());
            setResult(answer.message);
          } catch (error) {
            setResult(
              error instanceof Error
                ? error.message
                : "The test could not be sent."
            );
          } finally {
            setBusy(false);
          }
        }}
        className="pressable inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:opacity-50 max-sm:min-h-11 max-sm:px-3"
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Bell size={12} />
        )}
        {busy ? "Sending" : "Send a test"}
      </button>
      {result && (
        <span
          role="status"
          className="max-w-[15rem] text-right text-[11px] leading-snug text-muted-foreground"
        >
          {result}
        </span>
      )}
    </div>
  );
}

export default function NotificationCatalogue({
  disabledKinds,
}: {
  disabledKinds: string[];
}) {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Every notification the site can send
        </h2>
        <p className="text-[12.5px] text-muted-foreground">
          {CATALOGUE.length} of them
        </p>
      </div>
      <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        What the site says on its own, and what a super admin says to
        everybody. Each one can be sent to this device to see what it looks
        like, which is the only way to find out that the push keys, the
        service worker and this browser are all in order.
      </p>

      <ul className="mt-5 space-y-2.5">
        {CATALOGUE.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium leading-snug text-foreground">
                {entry.title}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                {entry.what}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                <span className="rounded-full border border-border px-2 py-0.5">
                  {KIND_LABEL[entry.kind]}
                </span>
                <span aria-hidden="true">·</span>
                <span>{entry.when}</span>
                {!entry.automatic && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-accent">sent by hand</span>
                  </>
                )}
                {disabledKinds.includes(entry.kind) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-red-300">
                      switched off for everybody
                    </span>
                  </>
                )}
              </p>
            </div>

            <TestButton id={entry.id} label={entry.title} />
          </li>
        ))}
      </ul>
    </div>
  );
}
