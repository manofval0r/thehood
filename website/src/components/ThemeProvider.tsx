"use client";

import * as React from "react";

/**
 * Theme.
 *
 * Dark is the brand, so it is the default. Light is an override, and the OS
 * preference is honoured only until the reader makes an explicit choice: once
 * `data-theme` is written to <html> it is the only thing consulted, because a
 * toggle that silently reverts when the OS changes at sunset is a toggle that
 * lies.
 *
 * The matching script in the root layout runs before first paint, so the page
 * never flashes dark on the way to light. This provider only has to keep React
 * and the DOM in agreement afterwards.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "cybersec-300l-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  /** False until the client has read the stored/OS value. */
  ready: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
  ready: false,
});

/** Mirrors what the pre-paint script does, so server and client agree. */
function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const current = readTheme();
    setThemeState(current);
    // Publish it even when it matches the OS, so the attribute is explicit and
    // the media query stops being consulted.
    document.documentElement.setAttribute("data-theme", current);
    document.documentElement.style.colorScheme = current;
    setReady(true);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode, or storage full. The theme still applies for this
      // session, which is most of the value.
    }
  }, []);

  const toggle = React.useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  // Follow the OS while the reader has expressed no preference of their own.
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (stored === "light" || stored === "dark") return;
      const next: Theme = e.matches ? "light" : "dark";
      setThemeState(next);
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.style.colorScheme = next;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggle, ready }),
    [theme, setTheme, toggle, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

/**
 * Runs before first paint. Inlined into the head rather than shipped as a
 * bundle chunk, because a deferred script is a visible flash of the wrong
 * theme on every navigation.
 *
 * Kept as a string constant so the same source is used by the layout and can
 * be unit-checked, rather than drifting into two copies.
 */
export const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var d=document.documentElement;d.setAttribute("data-theme",t);d.style.colorScheme=t;}catch(e){}})();`;

export default ThemeProvider;