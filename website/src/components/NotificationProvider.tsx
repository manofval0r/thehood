"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deviceId,
  ensureWorker,
  fetchUpdates,
  localKinds,
  pushAllowed,
  pushSupported,
  quietNow,
  savePrefs,
  setCursor,
  setLocalKinds,
  showLocal,
  subscribe,
  unsubscribe,
  useClassTimers,
  type ClassSlot,
  type Prefs,
  type Update,
} from "@/lib/notifications-client";
import type { NotificationKind } from "@/lib/notification-kinds";

/**
 * The notification state for this device.
 *
 * It lives in one place because three things need it and they must not
 * disagree: the bell in the navigation says how much is unread, the panel
 * says what is unread, and the timers say what is about to happen.
 */

interface NotificationValue {
  /** Whether the browser can do any of this at all. */
  supported: boolean;
  /** Whether the reader has said yes. */
  allowed: boolean;
  /**
   * What the browser says about permission: not asked, granted, or denied.
   * The three need different copy, because a denied permission cannot be
   * asked for again.
   */
  permission: "default" | "granted" | "denied" | "unsupported";
  /** Whether this device has a push subscription. */
  subscribed: boolean;
  prefs: Prefs;
  updates: Update[];
  upcoming: Update[];
  unread: number;
  staff: { pending: number; incomplete: number } | null;
  health: { news: boolean; storage: boolean } | null;
  /** Turn notifications on. Asks the browser for permission. */
  turnOn: () => Promise<boolean>;
  /** Turn them off and forget the subscription. */
  turnOff: () => Promise<void>;
  /** Which kinds this device wants. Empty means all of them. */
  setKinds: (kinds: NotificationKind[]) => Promise<void>;
  /** Quiet hours, in the device's own clock. */
  setQuiet: (from: string, to: string) => Promise<void>;
  /** Ask the site what has changed. */
  refresh: () => Promise<void>;
  /** Say the notifications have been read. */
  markRead: () => void;
}

const DEFAULT_PREFS: Prefs = {
  kinds: [],
  courses: [],
  quietFrom: "22:00",
  quietTo: "06:00",
  tz: "Africa/Lagos",
};

const NotificationContext = createContext<NotificationValue>({
  supported: false,
  allowed: false,
  permission: "unsupported",
  subscribed: false,
  prefs: DEFAULT_PREFS,
  updates: [],
  upcoming: [],
  unread: 0,
  staff: null,
  health: null,
  turnOn: async () => false,
  turnOff: async () => {},
  setKinds: async () => {},
  setQuiet: async () => {},
  refresh: async () => {},
  markRead: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [permission, setPermission] = useState<
    "default" | "granted" | "denied" | "unsupported"
  >("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setLocalPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [upcoming, setUpcoming] = useState<Update[]>([]);
  const [unread, setUnread] = useState(0);
  const [staff, setStaff] = useState<{ pending: number; incomplete: number } | null>(null);
  const [health, setHealth] = useState<{ news: boolean; storage: boolean } | null>(null);
  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const payload = await fetchUpdates();
    if (!payload || !mounted.current) return;
    setUpdates(payload.updates);
    setUpcoming(payload.upcoming);
    setUnread(payload.unread);
    setStaff(payload.staff);
    setHealth(payload.health);
    setClasses(payload.classes ?? []);
  }, []);

  /* The worker, the permission, and the subscription. */
  useEffect(() => {
    if (!pushSupported()) return;

    setSupported(true);
    setPermission(
      "Notification" in window
        ? (Notification.permission as "default" | "granted" | "denied")
        : "unsupported"
    );
    setAllowed(pushAllowed());

    void (async () => {
      const worker = await ensureWorker();
      if (!worker) return;
      const subscription = await worker.pushManager.getSubscription();
      if (mounted.current) setSubscribed(Boolean(subscription));
    })();

    /* The preferences, from the server, so the two agree. */
    void (async () => {
      try {
        const res = await fetch("/api/push", {
          headers: { "x-device-id": deviceId() },
        });
        if (!res.ok) return;
        const body = await res.json();
        if (mounted.current && body.prefs) {
          setLocalPrefs({ ...DEFAULT_PREFS, ...body.prefs });
          setLocalKinds(body.prefs.kinds ?? []);
        }
      } catch {
        // The local kinds are still the ones the reader chose.
      }
    })();
  }, []);

  /* What has changed, every minute, while the tab is looking. */
  useEffect(() => {
    void refresh();
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60000);
    return () => clearInterval(tick);
  }, [refresh]);

  /* The class reminders, timed here because the times are known already. */
  useClassTimers(
    classes,
    allowed && localKinds().includes("classes"),
    (title, body, href) => {
      if (quietNow(prefs)) return;
      showLocal(title, body, href);
    }
  );

  const turnOn = useCallback(async () => {
    const ok = await subscribe();
    if (!mounted.current) return ok;
    setAllowed(pushAllowed());
    setPermission(
      "Notification" in window
        ? (Notification.permission as "default" | "granted" | "denied")
        : "unsupported"
    );
    setSubscribed(ok);
    if (ok) {
      // The kinds the reader had chosen are kept; the subscription is what
      // was missing.
      await savePrefs({
        kinds: localKinds(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    return ok;
  }, []);

  const turnOff = useCallback(async () => {
    await unsubscribe();
    if (mounted.current) {
      setSubscribed(false);
      setAllowed(pushAllowed());
    }
  }, []);

  const setKinds = useCallback(async (kinds: NotificationKind[]) => {
    setLocalKinds(kinds);
    setLocalPrefs((p) => ({ ...p, kinds }));
    await savePrefs({
      kinds,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  const setQuiet = useCallback(async (from: string, to: string) => {
    setLocalPrefs((p) => ({ ...p, quietFrom: from, quietTo: to }));
    await savePrefs({
      quietFrom: from,
      quietTo: to,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  const markRead = useCallback(() => {
    setUnread(0);
    setCursor(new Date().toISOString());
  }, []);

  const value = useMemo(
    () => ({
      supported,
      allowed,
      permission,
      subscribed,
      prefs,
      updates,
      upcoming,
      unread,
      staff,
      health,
      turnOn,
      turnOff,
      setKinds,
      setQuiet,
      refresh,
      markRead,
    }),
    [
      supported,
      allowed,
      permission,
      subscribed,
      prefs,
      updates,
      upcoming,
      unread,
      staff,
      health,
      turnOn,
      turnOff,
      setKinds,
      setQuiet,
      refresh,
      markRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationValue {
  return useContext(NotificationContext);
}
