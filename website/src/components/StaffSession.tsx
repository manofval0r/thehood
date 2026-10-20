"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Permission } from "@/lib/permissions";

/**
 * Whether a member of staff is signed in.
 *
 * The navigation bar changes for a member of staff: the links a student
 * needs are not the links a member of staff needs, and the staff area is a
 * set of pages rather than one long page.
 *
 * This lives here rather than being read in the layout because the layout is
 * where the bar lives, and a cookie read in the layout would make every page
 * of the site wait for a request. The bar asks once, and the answer is the
 * same for the whole visit.
 *
 * For a student the answer costs one small request and no database query,
 * because there is no session cookie to look up.
 */

export interface StaffSession {
  isAdmin: boolean;
  name?: string;
  role?: string;
  permissions?: Permission[];
}

interface StaffSessionValue {
  session: StaffSession | null;
  /** Ask again. Used after signing in or out. */
  refresh: () => Promise<void>;
}

const StaffSessionContext = createContext<StaffSessionValue>({
  session: null,
  refresh: async () => {},
});

export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as StaffSession;
      setSession(data);
    } catch {
      // The student links are the right ones to show if we cannot tell.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ session, refresh }), [session, refresh]);

  return (
    <StaffSessionContext.Provider value={value}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession(): StaffSessionValue {
  return useContext(StaffSessionContext);
}
