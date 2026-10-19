import { cn } from "@/lib/utils";

/**
 * Document marks, drawn per file type.
 *
 * A generic file icon says only "a file". These say which one, at a glance,
 * in the same chunky language as the rest of the artwork. Each is drawn on a
 * 24x24 grid with a consistent 2px stroke and rounded joins, so they read as
 * one family rather than as five unrelated glyphs.
 */

export type DocType = "pdf" | "pptx" | "xlsx" | "doc" | "other";

interface MarkProps {
  type: DocType;
  className?: string;
}

/** Colour and label per type, shared by the mark and its card. */
export const DOC_STYLE: Record<
  DocType,
  { label: string; short: string; fg: string; bg: string; text: string }
> = {
  pdf: {
    label: "PDF",
    short: "PDF",
    fg: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    text: "text-tone-exams",
  },
  pptx: {
    label: "Slide deck",
    short: "PPT",
    fg: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    text: "text-tone-ceremony",
  },
  xlsx: {
    label: "Spreadsheet",
    short: "XLS",
    fg: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    text: "text-tone-academic",
  },
  doc: {
    label: "Document",
    short: "DOC",
    fg: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    text: "text-tone-statutory",
  },
  other: {
    label: "File",
    short: "FILE",
    fg: "#a3a3a3",
    bg: "rgba(163,163,163,0.12)",
    text: "text-muted-foreground",
  },
};

/** Page outline with a folded corner, shared by every mark. */
function Sheet({ children, color }: { children?: React.ReactNode; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Sheet with a clipped top-right corner. */}
      <path d="M13.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.5z" />
      <path d="M13.5 2.5v4a2 2 0 0 0 2 2h4" />
      {children}
    </svg>
  );
}

export function DocMark({ type, className }: MarkProps) {
  const color = DOC_STYLE[type].fg;

  return (
    <span className={cn("inline-flex h-full w-full", className)}>
      {type === "pdf" && (
        <Sheet color={color}>
          {/* A ruled page: the lines stand in for text. */}
          <path d="M8 13.5h8M8 16.5h8M8 19h5" opacity={0.65} />
        </Sheet>
      )}

      {type === "pptx" && (
        <Sheet color={color}>
          {/* A bar chart on the slide. */}
          <path d="M8.5 19.5v-4M12 19.5v-7M15.5 19.5v-2.5" />
        </Sheet>
      )}

      {type === "xlsx" && (
        <Sheet color={color}>
          {/* A grid. */}
          <path d="M8 13.5h8v6H8zM12 13.5v6M8 16.5h8" opacity={0.8} />
        </Sheet>
      )}

      {type === "doc" && (
        <Sheet color={color}>
          <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18.5h4" />
        </Sheet>
      )}

      {type === "other" && (
        <Sheet color={color}>
          <circle cx="12" cy="16.5" r="2.5" />
        </Sheet>
      )}
    </span>
  );
}

export default DocMark;
