"use client";

import * as React from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { deviceId } from "@/lib/notifications-client";
import { sendTestNotification } from "@/app/admin/actions";

/**
 * Send a test notification to this device.
 *
 * The three things that can break the notifications are the push keys, the
 * service worker and the browser's own permission, and none of them can be
 * checked by looking at the server. So a super admin presses this and sees
 * whether the thing arrives.
 *
 * It goes to the device that pressed the button and nowhere else, and it
 * ignores the quiet hours, because a test that does not arrive because it
 * is the middle of the night says nothing about the keys.
 */
export default function TestNotification() {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const answer = await sendTestNotification(deviceId());
      setResult(answer);
    } catch (error) {
      setResult({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "The test could not be sent.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Test the notifications
          </h2>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            Sends one notification to this device and nowhere else. It comes
            even in your quiet hours, because the point is to find out whether
            the keys, the service worker and this browser are in order.
          </p>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="pressable inline-flex shrink-0 items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 max-sm:min-h-11 max-sm:px-4 max-sm:text-base"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Bell size={14} />
          )}
          {busy ? "Sending" : "Send a test"}
        </button>
      </div>

      {result && (
        <p
          role="status"
          className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-[12.5px] ${
            result.ok
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {result.ok ? (
            <Check size={14} className="mt-0.5 shrink-0" />
          ) : (
            <Bell size={14} className="mt-0.5 shrink-0" />
          )}
          {result.message}
        </p>
      )}
    </section>
  );
}
