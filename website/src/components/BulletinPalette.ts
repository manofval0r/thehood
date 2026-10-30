"use client";

import { useEffect, useState } from "react";

/**
 * The bulletin's colour values, read from the site's own tokens.
 *
 * The board is drawn against the theme, so it must read the theme. It gets
 * its colours from the same `--color-*` custom properties the rest of the
 * site uses, which keeps a dark reader and a light reader looking at the same
 * design. Reading them in JavaScript lets the 3D board and the 2D board draw
 * in exactly the colours the tokens declare.
 */

export interface BulletinTones {
  academic: string;
  exams: string;
  holiday: string;
  statutory: string;
  ceremony: string;
}

export interface BulletinPalette {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  alert: string;
  tones: BulletinTones;
}

function read(name: string, fallback: string, root: CSSStyleDeclaration): string {
  const value = root.getPropertyValue(name).trim();
  return value || fallback;
}

/** Read the bulletin palette from the document root's computed tokens. */
export function readBulletinPalette(): BulletinPalette {
  const root = getComputedStyle(document.documentElement);
  const tones: BulletinTones = {
    academic: read("--tone-academic", "#22c55e", root),
    exams: read("--tone-exams", "#f59e0b", root),
    holiday: read("--tone-holiday", "#64748b", root),
    statutory: read("--tone-statutory", "#60a5fa", root),
    ceremony: read("--tone-ceremony", "#c084fc", root),
  };
  return {
    background: read("--color-background", "#000000", root),
    surface: read("--color-surface", "#0a0a0a", root),
    surfaceRaised: read("--color-surface-raised", "#1a1a1a", root),
    surfaceHover: read("--color-surface-hover", "#141414", root),
    border: read("--color-border", "#1f1f1f", root),
    borderStrong: read("--color-border-strong", "#2a2a2a", root),
    foreground: read("--color-foreground", "#ffffff", root),
    muted: read("--color-muted", "#6b6b6b", root),
    mutedForeground: read("--color-muted-foreground", "#9a9a9a", root),
    accent: read("--color-accent", "#22c55e", root),
    accentForeground: read("--color-accent-foreground", "#04140a", root),
    alert: "#f87171",
    tones,
  };
}

/**
 * The colour of a note's edge and pin, keyed by the bulletin kind. It is
 * decoration only; every note also carries its kind as text, because colour
 * is never the only signal.
 */
export function noteTone(
  item: { kind: string; urgent?: boolean },
  palette: BulletinPalette
): string {
  if (item.urgent || item.kind === "alert") return palette.alert;
  if (item.kind === "deadline") return palette.tones.exams;
  if (item.kind === "event") return palette.tones.ceremony;
  if (item.kind === "notice" || item.kind === "resource") return palette.tones.statutory;
  return palette.tones.academic;
}

/**
 * Re-reads the palette whenever the theme changes, so the 3D board stays in
 * the right colours without the reader having to reload.
 */
export function useBulletinPalette(): BulletinPalette | null {
  const [palette, setPalette] = useState<BulletinPalette | null>(null);

  useEffect(() => {
    const refresh = () => setPalette(readBulletinPalette());
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return palette;
}
