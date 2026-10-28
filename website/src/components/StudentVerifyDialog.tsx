"use client";

import { useRef, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export default function StudentVerifyDialog({
  onVerified,
  onClose,
}: {
  onVerified: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDialogFocus({
    open: true,
    panelRef,
    triggerRef: closeRef,
    onClose,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matric: String(data.get("matric") ?? ""),
          surname: String(data.get("surname") ?? ""),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Verification could not be completed.");
        return;
      }
      onVerified();
    } catch {
      setError("Verification is unavailable right now. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close student verification"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-background/80 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-verify-title"
        tabIndex={-1}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-xl border border-border-strong bg-surface-raised p-5 shadow-lift sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <ShieldCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="student-verify-title" className="text-lg font-semibold text-foreground">
              Verify this device
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Enter your matric number and registered surname once to reveal
              cohort meeting links and respond to events. Nothing is posted to
              Outlook or WhatsApp.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Matric number
            </span>
            <input
              name="matric"
              inputMode="text"
              autoComplete="username"
              required
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Registered surname
            </span>
            <input
              name="surname"
              autoComplete="family-name"
              required
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground outline-none focus:border-accent"
            />
          </label>
          {error && (
            <p role="alert" className="text-[12.5px] leading-relaxed text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="pressable flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground disabled:opacity-50"
          >
            {busy ? "Checking" : "Verify and continue"}
          </button>
          <p className="text-[11px] leading-relaxed text-muted">
            This is lightweight cohort verification, not a university account.
            The session lasts 30 days on this device.
          </p>
        </form>
      </div>
    </>
  );
}
