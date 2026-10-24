"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Copy, Check, FileCode } from "lucide-react";
import { useFileText } from "./use-file";

/** How many children of one branch are shown before the rest are counted. */
const CHILD_LIMIT = 200;

type Json = unknown;

interface Leaf {
  kind: "leaf";
  value: string;
  className: string;
}

function leafOf(value: Json): Leaf {
  if (value === null) return { kind: "leaf", value: "null", className: "text-muted" };
  switch (typeof value) {
    case "string":
      return { kind: "leaf", value: `"${value}"`, className: "text-accent" };
    case "number":
      return { kind: "leaf", value: String(value), className: "text-[#f59e0b]" };
    case "boolean":
      return {
        kind: "leaf",
        value: String(value),
        className: "text-[#c084fc]",
      };
    default:
      return { kind: "leaf", value: String(value), className: "text-muted" };
  }
}

function Branches({
  name,
  value,
  depth,
}: {
  name: string;
  value: Json;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);

  const entries: [string, Json][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, Json>);

  const shown = entries.slice(0, CHILD_LIMIT);
  const hidden = entries.length - shown.length;

  const isArray = Array.isArray(value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-surface-hover max-sm:min-h-11 max-sm:items-center"
      >
        <ChevronRight
          size={13}
          className={`mt-[3px] shrink-0 text-muted transition-transform max-sm:mt-0 ${
            open ? "rotate-90" : ""
          }`}
        />
        {name !== "" && (
          <span className="shrink-0 text-muted-foreground">
            {name}
            <span className="text-muted">:</span>
          </span>
        )}
        <span className="text-muted">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>

      {open && (
        <div className="ml-[11px] border-l border-border pl-3">
          {shown.map(([key, child]) => (
            <JsonNode key={key} name={key} value={child} depth={depth + 1} />
          ))}
          {hidden > 0 && (
            <p className="px-1 py-0.5 text-[11.5px] text-muted">
              and {hidden.toLocaleString()} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function JsonNode({
  name,
  value,
  depth,
}: {
  name: string;
  value: Json;
  depth: number;
}) {
  if (value !== null && typeof value === "object") {
    return <Branches name={name} value={value} depth={depth} />;
  }

  const leaf = leafOf(value);
  return (
    <div className="flex items-start gap-1.5 px-1 py-0.5 leading-[1.7]">
      <span className="mt-[3px] w-[13px] shrink-0" aria-hidden="true" />
      {name !== "" && (
        <span className="shrink-0 text-muted-foreground">
          {name}
          <span className="text-muted">:</span>
        </span>
      )}
      <span className={`break-all font-mono text-[12.5px] ${leaf.className}`}>
        {leaf.value}
      </span>
    </div>
  );
}

/**
 * A JSON file, read as a tree.
 *
 * The settings files in the lab manual are the reason: a student is meant to
 * see what a key holds, and what a key holds is easier to read as a tree
 * than as a wall of braces. The raw text is one click away, because that is
 * what gets copied into a report.
 */
export default function JsonViewer({ url }: { url: string }) {
  const state = useFileText(url);
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    if (state.status !== "ready") return null;
    try {
      return { ok: true as const, value: JSON.parse(state.value) as Json };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof Error ? error.message : "That is not valid JSON.",
      };
    }
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

  if (parsed && !parsed.ok) {
    return (
      <div className="p-6">
        <p className="text-[13px] font-medium text-foreground">
          That file is not valid JSON
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {parsed.message}
        </p>
        <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-surface p-3 font-mono text-[12px] text-muted-foreground">
          {state.value.slice(0, 20000)}
        </pre>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Nothing to do. The raw text is on screen.
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
        <button
          type="button"
          onClick={() => setRaw((r) => !r)}
          className="pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11 max-sm:px-3"
        >
          <FileCode size={13} />
          {raw ? "Tree" : "Raw"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="pressable flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11 max-sm:px-3"
        >
          {copied ? (
            <Check size={13} className="text-accent" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {raw ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.7] text-foreground">
            {state.value}
          </pre>
        ) : (
          <JsonNode name="" value={parsed?.value ?? null} depth={0} />
        )}
      </div>
    </div>
  );
}
