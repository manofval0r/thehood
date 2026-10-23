"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationKind } from "@/lib/notification-kinds";

/**
 * Notifications, on the reader's side.
 *
 * The browser's own notification API does the showing. This file decides
 * when to ask for permission, keeps the device's id and preferences, asks
 * the site what has changed, and sets the timers for the classes.
 *
 * Nothing here talks to a third party. The service worker is served from this
 * site's own origin, and the push service the browser talks to is the
 * browser's own, not ours.
 */

export interface Update {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  href?: string;
  course?: string;
  /** The announcement this is, when it is one. */
  announcementId?: string;
  /** Whether the reader is asked to say they have seen it. */
  needsAck?: boolean;
}

export interface ClassSlot {
  course: string;
  title: string;
  start: number;
  end: number;
  day: string;
  venue: string;
}

export interface Prefs {
  kinds: NotificationKind[];
  courses: string[];
  quietFrom: string;
  quietTo: string;
  tz: string;
  /** When enabled, the site sends one daily digest instead of individual
     push notifications for each class. */
  digestMode: boolean;
}

export interface UpdatesPayload {
  since: string;
  updates: Update[];
  upcoming: Update[];
  unread: number;
  /** The announcements this device has already said it has seen. */
  acked: string[];
  /**
   * The announcements still waiting for a confirmation.
   *
   * These stay in the list until the reader says they have seen them, even
   * after the cursor has moved past them. A class that is not running has
   * to stay in front of the reader until they know.
   */
  pending: Update[];
  /** The next day of classes, so the browser can time the reminders itself. */
  classes: ClassSlot[];
  staff: { pending: number; incomplete: number } | null;
  health: { news: boolean; storage: boolean } | null;
}

const DEVICE_KEY = "thehood.device";
const CURSOR_KEY = "thehood.cursor";
const KINDS_KEY = "thehood.kinds";

/** The device's id. It says nothing about who is holding it. */
export function deviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `d_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function cursor(): string {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(CURSOR_KEY) ??
    new Date(Date.now() - 7 * 86400000).toISOString()
  );
}

export function setCursor(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURSOR_KEY, value);
}

/** The kinds this device wants. Empty means all of them. */
export function localKinds(): NotificationKind[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KINDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as NotificationKind[];
  } catch {
    return [];
  }
}

export function setLocalKinds(kinds: NotificationKind[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KINDS_KEY, JSON.stringify(kinds));
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushAllowed(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  );
}

export function quietNow(prefs: Prefs, at: Date = new Date()): boolean {
  const parse = (value: string) => {
    const m = value.match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  };
  const from = parse(prefs.quietFrom);
  const to = parse(prefs.quietTo);
  if (from === to) return false;

  let now: number;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: prefs.tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(at);
    now =
      Number(parts.find((p) => p.type === "hour")?.value ?? "0") * 60 +
      Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  } catch {
    now = at.getHours() * 60 + at.getMinutes();
  }

  return from < to ? now >= from && now < to : now >= from || now < to;
}

/* ------------------------------------------------------------- the worker */

let registration: ServiceWorkerRegistration | null = null;

/** Register the service worker. It is what makes a push possible at all. */
export async function ensureWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (registration) return registration;
  try {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch {
    return null;
  }
}

/** The public key the browser needs to make a subscription. */
export async function fetchPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push", {
      headers: { "x-device-id": deviceId() },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.publicKey ?? null;
  } catch {
    return null;
  }
}

/** Ask for permission and subscribe. Returns true if it worked. */
export async function subscribe(): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const worker = await ensureWorker();
  if (!worker) return false;

  const key = await fetchPublicKey();
  if (!key) return false;

  const existing = await worker.pushManager.getSubscription();
  const subscription =
    existing ??
    (await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

  await fetch("/api/push", {
    method: "POST",
    headers: { "x-device-id": deviceId() },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  return true;
}

/** Stop the pushes and forget the subscription. */
export async function unsubscribe(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const worker = await ensureWorker();
  const subscription = await worker?.pushManager.getSubscription();
  if (!subscription) return;

  await fetch("/api/push", {
    method: "DELETE",
    headers: { "x-device-id": deviceId() },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

/** The preferences the server holds for this device. */
export async function savePrefs(prefs: Partial<Prefs>): Promise<void> {
  await fetch("/api/push", {
    method: "POST",
    headers: { "x-device-id": deviceId() },
    body: JSON.stringify({ prefs }),
  });
}

/** Base64 to the byte array the push API wants. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalised);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/* ------------------------------------------------------------ the polling */

/** What has changed, and what is coming. */
export async function fetchUpdates(since?: string): Promise<UpdatesPayload | null> {
  try {
    const res = await fetch(
      `/api/updates?since=${encodeURIComponent(since ?? cursor())}`,
      { headers: { "x-device-id": deviceId() }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as UpdatesPayload;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- the acks */

/**
 * Say that this device has seen an announcement.
 *
 * A message can ask for a confirmation, and this is where the confirmation
 * goes. It is a device and not a person, because the students have no
 * accounts, so there is nothing here that says who is holding the phone.
 */
export async function acknowledge(announcementId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/announcements/${encodeURIComponent(announcementId)}/ack`, {
      method: "POST",
      headers: { "x-device-id": deviceId() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------- the timers */

/**
 * A local notification, shown without a server being involved.
 *
 * The class times are known in advance, so a tab that is open can time the
 * reminder exactly. This is the half of the class reminders that works
 * without a push service, and it works the moment the site is open.
 */
export function showLocal(title: string, body: string, href?: string): void {
  if (!pushAllowed()) return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon-192.png",
      badge: "/favicon-96.png",
      tag: href ?? title,
      data: { href: href ?? "/" },
    });
  } catch {
    // Some browsers only allow notifications from a service worker.
  }
}

/**
 * The timers for the classes.
 *
 * Two moments matter: a few minutes before it starts, and the moment it
 * ends. The end is the useful one, because that is when the material for
 * the class is up.
 */
export function useClassTimers(
  classes: ClassSlot[],
  enabled: boolean,
  onFire: (title: string, body: string, href?: string) => void
): void {
  const fired = useRef<Set<string>>(new Set());
  const handler = useRef(onFire);
  handler.current = onFire;

  useEffect(() => {
    if (!enabled || classes.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const slot of classes) {
      const startIn = slot.start - Date.now() - 5 * 60 * 1000;
      const endAt = slot.end;

      if (startIn > 0 && startIn < 12 * 60 * 60 * 1000) {
        const key = `start:${slot.course}:${slot.start}`;
        if (!fired.current.has(key)) {
          fired.current.add(key);
          timers.push(
            setTimeout(() => {
              handler.current(
                `${slot.course} starts in five minutes`,
                `${slot.title} · ${slot.venue}`,
                "/timetable"
              );
            }, startIn)
          );
        }
      }

      const untilEnd = endAt - Date.now();
      if (untilEnd > 0 && untilEnd < 12 * 60 * 60 * 1000) {
        const key = `end:${slot.course}:${slot.end}`;
        if (!fired.current.has(key)) {
          fired.current.add(key);
          timers.push(
            setTimeout(() => {
              handler.current(
                `${slot.course} has just ended`,
                `${slot.title}. The material for it should be on the course page.`,
                "/timetable"
              );
            }, untilEnd)
          );
        }
      }
    }

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [classes, enabled]);
}
