"use client";

import * as React from "react";
import {
  Download,
  FileText,
  Presentation,
  Tablet,
  FileCode,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { resourceUrl } from "@/lib/resources";

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  pptx: Presentation,
  xlsx: Tablet,
  doc: FileCode,
  other: FileText,
};

interface ResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: { id: string; title: string; type: string; url: string; size?: string };
}

export default function ResourceModal({
  open,
  onOpenChange,
  resource,
}: ResourceModalProps) {
  const [pdfLib, setPdfLib] = React.useState<typeof import("react-pdf") | null>(null);
  const [numPages, setNumPages] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState(false);
  const [loadKey, setLoadKey] = React.useState(0);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const isPdf = resource.type === "pdf";
  const href = resourceUrl(resource.url);
  const Icon = TYPE_ICON[resource.type] || FileText;

  // react-pdf touches `window`, so it only ever loads on the client.
  React.useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;
    import("react-pdf")
      .then((lib) => {
        if (cancelled) return;
        lib.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        setPdfLib(() => lib);
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
    };
  }, [isPdf]);

  React.useEffect(() => {
    setPage(1);
    setNumPages(0);
    setError(false);
    setLoadKey((k) => k + 1);
  }, [resource.id, href]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (!numPages) return;
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, numPages));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, numPages]);

  React.useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-[var(--scrim)]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Centred sheet. Fixed insets rather than translate, so the body can
          scroll internally without the frame drifting on short viewports. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={resource.title}
        className="modal-in relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden border border-border bg-surface sm:h-auto sm:max-h-[88vh] sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-snug text-foreground">
              {resource.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                {resource.type}
              </span>
              {numPages > 0 && (
                <span className="tnum text-[11px] text-muted-foreground">
                  Page {page} of {numPages}
                </span>
              )}
              {resource.size && (
                <span className="tnum text-[11px] text-muted-foreground">
                  {resource.size}
                </span>
              )}
            </div>
          </div>

          <button
            ref={closeRef}
            onClick={() => onOpenChange(false)}
            className="pressable -mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-auto bg-background">
          {isPdf && pdfLib && (
            <div className="flex justify-center p-4 sm:p-6">
              <div className="overflow-hidden rounded border border-border bg-white shadow-lift">
                <pdfLib.Document
                  key={loadKey}
                  file={href}
                  onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                  onLoadError={() => setError(true)}
                  loading={
                    <div className="flex h-[50vh] w-[min(90vw,42rem)] items-center justify-center">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" />
                        Loading preview
                      </span>
                    </div>
                  }
                  error={
                    <div className="flex h-[40vh] w-[min(90vw,42rem)] flex-col items-center justify-center gap-3 p-8 text-center">
                      <FileText size={40} className="text-muted" />
                      <p className="text-sm text-muted-foreground">
                        This PDF could not be rendered here.
                      </p>
                    </div>
                  }
                >
                  <pdfLib.Page
                    pageNumber={page}
                    width={680}
                    className="max-w-full"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex h-[50vh] w-full items-center justify-center">
                        <Loader2 size={18} className="animate-spin text-muted" />
                      </div>
                    }
                  />
                </pdfLib.Document>
              </div>
            </div>
          )}

          {isPdf && !pdfLib && !error && (
            <div className="flex h-[50vh] items-center justify-center p-16">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Preparing viewer
              </span>
            </div>
          )}

          {isPdf && error && (
            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 p-12 text-center">
              <FileText size={44} className="text-muted" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Preview unavailable
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  The viewer could not load this file. You can still download it
                  and open it locally.
                </p>
              </div>
              <a
                href={href}
                download
                className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                <Download size={15} />
                Download instead
              </a>
            </div>
          )}

          {!isPdf && (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 p-12 text-center">
              <div className="rounded-lg bg-surface-hover p-6">
                <Icon size={40} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {resource.type === "pptx"
                    ? "Slide deck"
                    : resource.type === "xlsx"
                      ? "Spreadsheet"
                      : "Document"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {resource.type === "pptx"
                    ? "Slide previews are not available yet. Download the deck to open it in PowerPoint or Google Slides."
                    : resource.type === "xlsx"
                      ? "Download to open it in Excel or Google Sheets."
                      : "Download to open it in a text editor."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
          {isPdf && numPages > 1 ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="pressable flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="tnum min-w-[4rem] text-center text-sm text-muted-foreground">
                {page} / {numPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                disabled={page >= numPages}
                className="pressable flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {isPdf ? "Arrow keys page, Esc closes" : null}
            </span>
          )}

          <a
            href={href}
            download
            className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Download size={15} />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}