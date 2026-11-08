"use client";

import { useMemo, useState } from "react";
import { Copy, Check, WrapText } from "lucide-react";
import { useFileText } from "./use-file";
import { useComments } from "./useComments";
import CommentBadge from "./CommentBadge";

/**
 * A plain text file.
 *
 * The manifest files in the lab manual are text a student is meant to read
 * and copy out, so this is not a preview so much as a reader: it keeps the
 * line breaks, it numbers the lines so a reference like "line 42" means
 * something, and it can be copied out whole.
 */
export default function TextViewer({ url }: { url: string }) {
  const state = useFileText(url);
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.value.replace(/\r\n/g, "\n").split("\n");
  }, [state]);

  const { comments } = useComments({ fileId: url, fileKind: "text" });

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="tnum text-[11.5px] text-muted">
          {lines.length.toLocaleString()} lines
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrap((w) => !w)}
            aria-pressed={wrap}
            className="pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11 max-sm:px-3"
          >
            <WrapText size={13} />
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

      <div className="min-h-0 flex-1 overflow-auto">
        <pre className={`px-4 py-4 font-mono text-[12.5px] leading-[1.7] text-foreground`}>
          {lines.map((line, i) => {
            const lineComments = comments.filter(
              (c) =>
                c.comment.target_type === "line" &&
                JSON.stringify(c.comment.target_selector) ===
                  JSON.stringify({ line: i })
            );
            return (
              <div key={i} className="flex items-start min-w-0">
                <span
                  className="tnum shrink-0 w-8 select-none text-right text-[11px] text-muted"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span
                  className={`flex-1 min-w-0 ${wrap ? "break-words" : "whitespace-pre"}`}
                >
                  {line || " "}
                </span>
                <CommentBadge
                  fileId={url}
                  fileKind="text"
                  targetType="line"
                  targetSelector={{ line: i }}
                  label={`Line ${i + 1} comments`}
                />
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
