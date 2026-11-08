"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useFileText } from "./use-file";
import { CommentsProvider, useCommentsContext } from "./comments-context";
import CommentBadge from "./CommentBadge";
import { cn } from "@/lib/utils";

/**
 * A table file, read as a table.
 *
 * The evidence manifests are CSV. They are wide, they have quoted fields
 * with commas inside them, and some of them have a line break inside a
 * quoted field. Splitting on commas gets all of that wrong, so this parses
 * properly: a quoted field may contain the delimiter, a doubled quote is a
 * literal quote, and a quoted field may span lines.
 *
 * Annotation is behind a toggle, same as the other readers: the cell marker
 * appears on demand, or wherever a comment already lives.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && field === "") {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      endField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/** Whether the first line looks like tabs rather than commas. */
export function delimiterOf(text: string): string {
  const cut = text.indexOf("\n");
  const firstLine = cut === -1 ? text : text.slice(0, cut);
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

export default function CsvViewer({ url }: { url: string }) {
  const state = useFileText(url);
  const [limit, setLimit] = useState(200);
  const [annotate, setAnnotate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const parsed = useMemo(() => {
    if (state.status !== "ready") return null;
    const delimiter = delimiterOf(state.value);
    const rows = parseDelimited(state.value, delimiter);
    const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
    return { rows, width };
  }, [state]);

  // A scrollbar is not a reliable cue on a phone: it is often hidden until
  // the reader already knows to swipe. Measure the table and say so.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const next = el.scrollWidth - el.clientWidth > 1;
      setOverflowing((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [parsed, limit]);

  if (state.status === "loading") {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        Reading the table
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        {state.message}
      </p>
    );
  }

  if (!parsed || parsed.rows.length === 0) {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        That table is empty.
      </p>
    );
  }

  const { rows, width } = parsed;
  const shown = rows.slice(0, limit);

  return (
    <CommentsProvider fileId={url} fileKind="csv">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
          <span className="tnum text-[11.5px] text-muted">
            {rows.length.toLocaleString()} rows · {width} columns
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAnnotate((v) => !v)}
              aria-pressed={annotate}
              className={cn(
                "pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] transition-colors max-sm:min-h-11 max-sm:px-3",
                annotate
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <MessageSquarePlus size={13} aria-hidden="true" />
              {annotate ? "Annotating" : "Annotate"}
            </button>
            {rows.length > shown.length && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + 500)}
                className="pressable max-sm:inline-flex max-sm:min-h-11 max-sm:items-center max-sm:px-3 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                Show more
              </button>
            )}
          </div>
        </div>

        {overflowing && (
          <p className="shrink-0 border-b border-border bg-surface-raised px-4 py-1.5 text-[11.5px] text-muted-foreground sm:hidden">
            Swipe sideways to see the remaining columns.
          </p>
        )}

        <div
          ref={scrollRef}
          role="region"
          aria-label="Table. Scrolls sideways for the remaining columns."
          tabIndex={0}
          className="min-h-0 flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <TableBody shown={shown} width={width} annotate={annotate} />
        </div>
      </div>
    </CommentsProvider>
  );
}

function TableBody({
  shown,
  width,
  annotate,
}: {
  shown: string[][];
  width: number;
  annotate: boolean;
}) {
  const { comments } = useCommentsContext();

  const countFor = (r: number, c: number) =>
    comments.filter(
      (c0) =>
        c0.comment.target_type === "cell" &&
        JSON.stringify(c0.comment.target_selector) ===
          JSON.stringify({ row: r, col: c })
    ).length;

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          {Array.from({ length: width }, (_, c) => (
            <th
              key={c}
              className="sticky top-0 z-10 border-b border-r border-border bg-surface px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              {shown[0][c] || `Column ${c + 1}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.slice(1).map((row, r) => (
          <tr
            key={r}
            className="border-b border-border transition-colors hover:bg-surface-hover"
          >
            {Array.from({ length: width }, (_, c) => {
              const count = countFor(r, c);
              const show = annotate || count > 0;
              return (
                <td
                  key={c}
                  className="relative min-w-[7rem] px-3 py-1.5 align-top font-mono text-[12px] text-foreground"
                >
                  <span className="block max-w-[26rem] whitespace-pre-wrap break-words">
                    {row[c]}
                  </span>
                  {show && (
                    <span className="absolute right-1 top-1 z-10">
                      <CommentBadge
                        targetType="cell"
                        targetSelector={{ row: r, col: c }}
                        label={`Cell ${r + 2}, column ${c + 1} comments`}
                        annotate={annotate}
                      />
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
