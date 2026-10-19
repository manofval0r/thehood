"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resourceUrl } from "@/lib/resources";
import type { Resource } from "@/lib/resources";
import { cn } from "@/lib/utils";

import JSZip from "jszip";
import { saveAs } from "file-saver";

type Row = Resource & { course?: { code: string } };

interface BatchDownloadProps {
  resources: Row[];
  courseCode?: string;
}

/** Keep the name short enough for the button without truncating the meaning. */
function shortName(title: string) {
  const words = title.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 28 ? `${words.slice(0, 27)}…` : words;
}

export default function BatchDownload({ resources, courseCode }: BatchDownloadProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const chosen = useMemo(
    () => resources.filter((r) => selected.has(r.id)),
    [resources, selected]
  );
  const count = chosen.length;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = count > 0 && count === resources.length;
  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(resources.map((r) => r.id)));
  }, [allSelected, resources]);

  const folder = courseCode ? courseCode.replace(/\s+/g, "_") : "All-Courses";

  const run = useCallback(async () => {
    if (count === 0) return;

    // One file is not an archive. Send it straight down.
    if (count === 1) {
      const only = chosen[0];
      const a = document.createElement("a");
      a.href = resourceUrl(only.url);
      a.download = only.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSelected(new Set());
      return;
    }

    setBusy(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        chosen.map(async (r) => {
          const res = await fetch(resourceUrl(r.url));
          if (!res.ok) return;
          const blob = await res.blob();
          const safe = r.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
          zip.file(`${folder}/${safe}.${r.type}`, blob);
        })
      );
      saveAs(await zip.generateAsync({ type: "blob" }), `NUTM-${folder}-Resources.zip`);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }, [chosen, count, folder]);

  // The label always says what will actually happen next.
  const label = useMemo(() => {
    if (busy) return "Building zip";
    if (count === 0) return "Select files to download";
    if (count === 1) return `Download ${shortName(chosen[0].title)}`;
    return `Download ${count} files as zip`;
  }, [busy, count, chosen]);

  const single = count === 1;

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
          Batch download
        </h2>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
          {resources.length > 1 && (
            <button
              onClick={toggleAll}
              className="text-[12px] text-accent transition-opacity hover:opacity-75"
            >
              {allSelected ? "Unselect all" : "Select all"}
            </button>
          )}
        </div>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files available.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const checked = selected.has(r.id);
            return (
              <li key={r.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-all duration-200",
                    checked
                      ? "border-accent/40 bg-accent/8"
                      : "border-transparent bg-background hover:border-border hover:bg-surface-hover"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(r.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-[#22c55e]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {r.course?.code ?? courseCode} &middot; {r.type}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground">
          {count === 0
            ? "Pick one file to download it directly, or several to get a zip."
            : count === 1
              ? "One file downloads on its own."
              : `${count} files will be zipped under ${folder}/`}
        </p>

        <Button
          variant="accent"
          disabled={count === 0 || busy}
          onClick={run}
          className="pressable shrink-0 text-[12px]"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {label}
            </>
          ) : (
            <>
              {single ? <Download size={14} /> : <FileArchive size={14} />}
              {label}
            </>
          )}
        </Button>
      </div>
    </section>
  );
}