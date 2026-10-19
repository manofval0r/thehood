/**
 * The kinds of thing a study resource can be.
 *
 * Each kind has a pixel motif, drawn in tools/pixel-motifs.js. This file holds
 * only what the motif cannot carry: the words, and the recessed surface the
 * motif sits in.
 */

export type Kind =
  | "search"
  | "journal"
  | "video"
  | "practice"
  | "course"
  | "notebook"
  | "tool"
  | "reference";

export interface KindStyle {
  /** The word for it. Names the thing rather than gesturing at it. */
  label: string;
  /** What the motif depicts, for anyone who cannot see it. */
  motif: string;
  /** The panel the motif is set into. */
  surface: string;
}

export const KIND_STYLE: Record<Kind, KindStyle> = {
  search: {
    label: "Search",
    motif: "A magnifying lens over ruled lines",
    surface: "rgba(96,165,250,0.10)",
  },
  journal: {
    label: "Papers",
    motif: "A page with a folded corner and ruled lines",
    surface: "rgba(192,132,252,0.10)",
  },
  video: {
    label: "Watch",
    motif: "A video player with a play triangle and a progress bar",
    surface: "rgba(251,146,60,0.10)",
  },
  practice: {
    label: "Practise",
    motif: "A target with the centre marked",
    surface: "rgba(34,197,94,0.10)",
  },
  course: {
    label: "Course",
    motif: "A path through waypoints ending in a flag",
    surface: "rgba(245,158,11,0.10)",
  },
  notebook: {
    label: "Notes",
    motif: "A page with a marked margin",
    surface: "rgba(244,114,182,0.10)",
  },
  tool: {
    label: "Tool",
    motif: "A spanner head and handle",
    surface: "rgba(45,212,191,0.10)",
  },
  reference: {
    label: "Reference",
    motif: "A closed book with a ribbon",
    surface: "rgba(148,163,184,0.10)",
  },
};

/** The domain, without the scheme or a trailing slash. */
export function domainOf(href: string): string {
  return href
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}