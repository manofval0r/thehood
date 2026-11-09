"use client";

import { useMemo, useState } from "react";
import { Copy, Check, WrapText, MessageSquarePlus } from "lucide-react";
import { useFileText } from "./use-file";
import { useCommentsContext } from "./comments-context";
import { CommentsProvider } from "./comments-context";
import CommentBadge from "./CommentBadge";
import { cn } from "@/lib/utils";

/**
 * A plain text file.
 *
 * The manifest files in the lab manual are text a student is meant to read
 * and copy out, so this is not a preview so much as a reader: it keeps the
 * line breaks, it numbers the lines so a reference like "line 42" means
 * something, and it can be copied out whole.
 *
 * Annotation is behind a toggle. A badge permanently on every line is noise;
 * the toggle turns the reader into the annotator. Existing comment counts
 * stay visible either way.
 */
export default function TextViewer({ url }: { url: string }) {
  const state = useFileText(url);
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);
  const [annotate, setAnnotate] = useState(false);

  const lines = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.value.replace(/\r\n/g, "\n").split("\n");
  }, [state]);

  if (state.status === "loading") {
    return (
      <p className="p-10 text-center text-[13px] text-muted-foreground">
        Reading the file
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // A browser that will not let the page write to the clipboard is not
      // worth an error message. The text is on the screen to be selected.
    }
  };

  return (
    <CommentsProvider fileId={url} fileKind="text">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
          <span className="tnum text-[11.5px] text-muted">
            {lines.length.toLocaleString("en-GB")} lines
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
            <button
              type="button"
              onClick={() => setWrap((w) => !w)}
              aria-pressed={wrap}
              className="pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11 max-sm:px-3"
            >
              <WrapText size={13} aria-hidden="true" />
              {wrap ? "Wrapping" : "No wrap"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11 max-sm:px-3"
            >
              {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <LineRows url={url} lines={lines} wrap={wrap} annotate={annotate} />
      </div>
    </CommentsProvider>
  );
}

function LineRows({
  url,
  lines,
  wrap,
  annotate,
}: {
  url: string;
  lines: string[];
  wrap: boolean;
  annotate: boolean;
}) {
  const { comments } = useCommentsContext();

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <pre className="px-4 py-4 font-mono text-[12.5px] leading-[1.7] text-foreground">
        {lines.map((line, i) => {
          const count = comments.filter(
            (c) =>
              c.comment.target_type === "line" &&
              JSON.stringify(c.comment.target_selector) ===
                JSON.stringify({ line: i })
          ).length;
          const show = annotate || count > 0;
          return (
            <div key={i} className="relative flex min-w-0 items-start pr-2">
              <span
                className="tnum w-8 shrink-0 select-none text-right text-[11px] leading-[1.7] text-muted"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span
                className={`min-w-0 flex-1 break-words pl-3 ${wrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}
              >
                {line || " "}
              </span>
              {show && (
                <span className="absolute right-0 top-0 z-10">
                  <CommentBadge
                    targetType="line"
                    targetSelector={{ line: i }}
                    label={`Comments on line ${i + 1}`}
                    annotate={annotate}
                  />
                </span>
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
