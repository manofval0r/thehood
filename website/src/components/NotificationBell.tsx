"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useNotifications } from "@/components/NotificationProvider";
import { KIND_HELP, KIND_LABEL, type NotificationKind } from "@/lib/notification-kinds";

/**
 * The bell.
 *
 * It sits in the bar and says how much is unread, and opens a panel with
 * what is unread, what is coming, and the settings. The settings are per
 * kind, because somebody who wants to know when a class starts does not
 * necessarily want to know every time a mark is changed.
 *
 * Quiet hours are in the reader's own clock, and the server checks them as
 * well, so a push that should not have arrived does not.
 */

const KIND_ORDER: NotificationKind[] = [
  "material",
  "classes",
  "attendance",
  "calendar",
  "staff",
  "system",
];

function when(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationBell() {
  const {
    supported,
    allowed,
    permission,
    subscribed,
    prefs,
    updates,
    upcoming,
    unread,
    acked,
    staff,
    health,
    turnOn,
    turnOff,
    setKinds,
    setQuiet,
    setDigestMode,
    markRead,
    markAllRead,
    acknowledge,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (
        panel.current &&
        !panel.current.contains(e.target as Node) &&
        !button.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  function toggleKind(kind: NotificationKind) {
    const current = prefs.kinds.length === 0 ? KIND_ORDER : prefs.kinds;
    const next = current.includes(kind)
      ? current.filter((k) => k !== kind)
      : [...current, kind];
    void setKinds(next);
  }

  const kindsOn = (kind: NotificationKind) =>
    prefs.kinds.length === 0 || prefs.kinds.includes(kind);

  return (
    <div className="shrink-0 sm:relative">
      <button
        ref={button}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markRead();
        }}
        className="pressable relative grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
      >
        {/* A bell, drawn in pixels, like everything else here. */}
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <g fill="currentColor">
            <rect x="6" y="1" width="4" height="2" />
            <rect x="4" y="3" width="8" height="2" />
            <rect x="3" y="5" width="10" height="2" />
            <rect x="2" y="7" width="12" height="2" />
            <rect x="3" y="9" width="10" height="2" />
            <rect x="5" y="11" width="6" height="2" />
            <rect x="7" y="13" width="2" height="2" />
          </g>
        </svg>
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold leading-none text-accent-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 flex max-h-[calc(100dvh-5.5rem)] w-[calc(100vw-2rem)] max-w-sm origin-top-right flex-col overflow-hidden rounded-xl border border-border-strong bg-surface-raised shadow-lift sm:max-h-[32rem] sm:w-80"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-foreground">
                Notifications
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                {unread > 0 ? `${unread} unread` : "Up to date"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="pressable -mr-0.5 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {!supported && (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              This browser cannot show notifications. Everything is still on the
              pages themselves.
            </p>
          )}

          {supported && permission === "denied" && (
            <div className="mb-3 rounded-md border border-border bg-surface p-2.5">
              <p className="text-[12px] leading-relaxed text-foreground">
                Your browser is blocking notifications for this site. They can
                be allowed from the site settings, usually beside the address
                bar, and then this page will ask again.
              </p>
            </div>
          )}

          {supported && permission === "default" && (
            <div className="mb-3">
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                Tell us when a class starts, when new material is posted, and
                when your attendance is recorded.
              </p>
              <button
                type="button"
                onClick={() => void turnOn()}
                className="pressable mt-2.5 w-full rounded-md bg-accent px-3 py-2 text-[12.5px] font-semibold text-accent-foreground"
              >
                Turn on notifications
              </button>
            </div>
          )}

          {/* What has changed, and what is coming. Neither needs permission:
              the list is on the page, and the browser is already looking at
              it. Permission is only for the interruptions. */}
          {staff && (staff.pending > 0 || staff.incomplete > 0) && (
            <div className="mb-3 rounded-md border border-accent/40 bg-accent/5 p-2.5">
              <p className="text-[12px] font-semibold text-accent">
                {staff.pending > 0
                  ? `${staff.pending} waiting for approval`
                  : `${staff.incomplete} classes still unmarked`}
              </p>
            </div>
          )}

          {health && !health.news && (
            <div className="mb-3 rounded-md border border-border bg-surface p-2.5">
              <p className="text-[12px] text-foreground">
                The competitions feed is not answering. The rest of the site is
                fine.
              </p>
            </div>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            New
          </p>
          {updates.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Nothing since you last looked.
            </p>
          ) : (
            <div className="mt-1.5 space-y-1">
              <ul className="space-y-1.5 overflow-y-auto sm:max-h-52">
                {updates.slice(0, 12).map((u) => {
                  const seen =
                    !!u.announcementId && acked.includes(u.announcementId);
                  return (
                    <li key={u.id}>
                      <Link
                        href={u.href ?? "/"}
                        onClick={() => setOpen(false)}
                        className="pressable block rounded-md px-1.5 py-1 hover:bg-surface-hover"
                      >
                        <span className="block text-[12.5px] font-medium leading-snug text-foreground">
                          {u.title}
                        </span>
                        <span className="block text-[11.5px] leading-snug text-muted">
                          {u.body} · {when(u.at)}
                        </span>
                      </Link>

                      {/* A message can ask to be acknowledged, so that the
                          person who sent it knows it was seen. A class that is
                          not running is worth knowing about. */}
                      {u.needsAck && u.announcementId && (
                        <div className="px-1.5 pb-1">
                          {seen ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-accent">
                              <Check size={11} />
                              You have seen this
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void acknowledge(u.announcementId!)}
                              className="pressable inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                            >
                              <Check size={11} />
                              Got it
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => markAllRead()}
                className="pressable mt-2 text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Mark all as read
              </button>
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Coming up
              </p>
              <ul className="mt-1.5 space-y-1 overflow-y-auto sm:max-h-32">
                {upcoming.slice(0, 6).map((u) => (
                  <li key={u.id} className="px-1.5 py-0.5">
                    <span className="block text-[12.5px] leading-snug text-foreground">
                      {u.title}
                    </span>
                    <span className="block text-[11px] leading-snug text-muted">
                      {u.body}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setSettings((s) => !s)}
              className="pressable text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {settings ? "Hide the settings" : "What to be told about"}
            </button>

            {settings && (
              <div className="mt-2.5 space-y-2">
                {KIND_ORDER.map((kind) => (
                  <label
                    key={kind}
                    className="flex cursor-pointer items-start gap-2 text-[12px] text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={kindsOn(kind)}
                      onChange={() => toggleKind(kind)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        {KIND_LABEL[kind]}
                      </span>
                      <span className="block text-[11px] leading-snug">
                        {KIND_HELP[kind]}
                      </span>
                    </span>
                  </label>
                ))}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  <span>Quiet between</span>
                  <input
                    type="time"
                    value={prefs.quietFrom}
                    onChange={(e) => void setQuiet(e.target.value, prefs.quietTo)}
                    className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                  />
                  <span>and</span>
                  <input
                    type="time"
                    value={prefs.quietTo}
                    onChange={(e) => void setQuiet(prefs.quietFrom, e.target.value)}
                    className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                  />
                </div>

                {subscribed ? (
                  <button
                    type="button"
                    onClick={() => void turnOff()}
                    className="pressable mt-2 text-[11.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Turn notifications off
                  </button>
                ) : permission === "granted" ? (
                  <button
                    type="button"
                    onClick={() => void turnOn()}
                    className="pressable mt-2 text-[11.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Turn on notifications for this device
                  </button>
                ) : null}

                {/* Digest mode: one summary per day instead of per-class pushes */}
                <div className="mt-2.5 space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer text-[12px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={prefs.digestMode}
                      onChange={() => void setDigestMode(!prefs.digestMode)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        Daily digest instead of per-class pushes
                      </span>
                      <span className="block text-[11px] leading-snug text-muted">
                        Get one summary each morning instead of a push for every
                        class start and end.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
