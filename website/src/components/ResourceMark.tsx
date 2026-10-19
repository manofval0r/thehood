import { cn } from "@/lib/utils";

/**
 * Marks for study resources, drawn per kind.
 *
 * These are drawn rather than fetched. Pulling each site's own favicon would
 * mean twenty-odd third-party requests on one page load, which tells every
 * one of those sites who is reading and breaks the page the moment the
 * student is offline or behind a captive portal. Drawing them also lets the
 * page say something the favicon could not: not "this is arXiv" but "this is
 * where you read papers", which is the distinction the reader is actually
 * making while scanning.
 *
 * All marks share a 24x24 grid, the same stroke weight and rounded joins, so
 * they read as one family.
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

interface KindStyle {
  label: string;
  /** Ink for the mark. Distinct enough to scan by, calm enough to sit on a
   *  dark surface together. */
  fg: string;
  bg: string;
}

export const KIND_STYLE: Record<Kind, KindStyle> = {
  search: { label: "Search", fg: "#60a5fa", bg: "rgba(96,165,250,0.13)" },
  journal: { label: "Papers", fg: "#c084fc", bg: "rgba(192,132,252,0.13)" },
  video: { label: "Watch", fg: "#fb923c", bg: "rgba(251,146,60,0.13)" },
  practice: { label: "Practise", fg: "#22c55e", bg: "rgba(34,197,94,0.13)" },
  course: { label: "Course", fg: "#f59e0b", bg: "rgba(245,158,11,0.13)" },
  notebook: { label: "Notes", fg: "#f472b6", bg: "rgba(244,114,182,0.13)" },
  tool: { label: "Tool", fg: "#2dd4bf", bg: "rgba(45,212,191,0.13)" },
  reference: { label: "Reference", fg: "#94a3b8", bg: "rgba(148,163,184,0.13)" },
};

function Svg({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ResourceMark({
  kind,
  className,
}: {
  kind: Kind;
  className?: string;
}) {
  const c = KIND_STYLE[kind].fg;

  return (
    <span className={cn("inline-flex h-full w-full", className)}>
      {kind === "search" && (
        <Svg color={c}>
          {/* A lens over rows: searching a body of work. */}
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m14.6 14.6 4 4" />
          <path d="M8.5 9h4M8.5 11.5h4" opacity={0.6} />
        </Svg>
      )}

      {kind === "journal" && (
        <Svg color={c}>
          {/* Two stacked sheets: an archive. */}
          <path d="M4.5 5.5a2 2 0 0 1 2-2H16l3.5 3.5v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z" />
          <path d="M16 3.5V7a1 1 0 0 0 1 1h2.5" opacity={0.55} />
          <path d="M8 11h6M8 14h6M8 17h3" opacity={0.7} />
        </Svg>
      )}

      {kind === "video" && (
        <Svg color={c}>
          <rect x="2.8" y="5" width="18.4" height="14" rx="2.5" />
          <path d="m10.4 9.4 4.6 2.6-4.6 2.6z" />
        </Svg>
      )}

      {kind === "practice" && (
        <Svg color={c}>
          {/* Concentric rings with a hit: a target you work at. */}
          <circle cx="12" cy="12" r="8" opacity={0.45} />
          <circle cx="12" cy="12" r="4.6" opacity={0.75} />
          <circle cx="12" cy="12" r="1.4" fill={c} stroke="none" />
        </Svg>
      )}

      {kind === "course" && (
        <Svg color={c}>
          {/* Waypoints on a line: a path through a syllabus. */}
          <path d="M4 19V5" opacity={0.35} />
          <path d="M4 19c4 0 4-5 8-5s4-6 8-6" />
          <circle cx="4" cy="19" r="1.8" fill={c} stroke="none" />
          <circle cx="12" cy="14" r="1.8" fill={c} stroke="none" opacity={0.7} />
          <path d="m17.4 5.6 3.2 2.4-3.2 2.4z" />
        </Svg>
      )}

      {kind === "notebook" && (
        <Svg color={c}>
          <path d="M6 3.5h9.5L19 7v13.5H6z" />
          <path d="M15 3.5V7h4" opacity={0.55} />
          <path d="M9 12h6M9 15h4" opacity={0.7} />
          <path d="M9 18h3" opacity={0.45} />
        </Svg>
      )}

      {kind === "tool" && (
        <Svg color={c}>
          {/* A socket: the shape most of these tools share. */}
          <path d="M14.6 6.2a3.9 3.9 0 0 0 5 5l-8.4 8.4a2.6 2.6 0 0 1-3.7-3.7z" />
          <circle cx="7.4" cy="16.6" r="1.2" />
        </Svg>
      )}

      {kind === "reference" && (
        <Svg color={c}>
          {/* A closed book with a clasp. */}
          <path d="M4.5 5.2A1.7 1.7 0 0 1 6.2 3.5H19v14.8H6.2a1.7 1.7 0 0 0-1.7 1.7z" />
          <path d="M4.5 18.3a1.7 1.7 0 0 1 1.7-1.7H19v3.7H6.2a1.7 1.7 0 0 1-1.7-1.7z" opacity={0.55} />
          <path d="M8 8h7M8 11h5" opacity={0.7} />
        </Svg>
      )}
    </span>
  );
}

/** Just the domain, without the scheme or a trailing slash. */
export function domainOf(href: string): string {
  return href
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export default ResourceMark;