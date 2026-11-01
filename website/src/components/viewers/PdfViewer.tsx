"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from "lucide-react";

/**
 * A PDF, read page by page.
 *
 * The worker is served from the site's own folder rather than from a
 * content delivery network, so nothing about the reader leaves here. It is
 * loaded only when a PDF is actually opened, because it is a megabyte of
 * JavaScript and most readers will never ask for one.
 */
export default function PdfViewer({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [pdfLib, setPdfLib] = useState<typeof import("react-pdf") | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("react-pdf")
      .then((lib) => {
        if (cancelled) return;
        lib.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        setPdfLib(() => lib);
      })
      .catch(() =>
        setError("The viewer could not be loaded. Download the file instead.")
      );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setNumPages(0);
    setError(null);
  }, [url]);

  useEffect(() => {
    if (!pdfLib) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(p + 1, numPages));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pdfLib, numPages]);

  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [innerW, setInnerW] = useState(680);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setInnerW(el.clientWidth - 32));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageW = Math.min(680, Math.max(200, Math.round(innerW * zoom)));

  if (error) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 p-12 text-center">
        <FileText size={44} className="text-muted" />
        <div>
          <p className="text-sm font-medium text-foreground">Preview unavailable</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            {error}
          </p>
        </div>
        <a
          href={url}
          download
          className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground max-sm:min-h-11"
        >
          <Download size={15} />
          Download instead
        </a>
      </div>
    );
  }

  if (!pdfLib) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center p-16">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Preparing viewer
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={containerRef} className="flex min-h-0 flex-1 justify-start overflow-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto overflow-hidden rounded border border-border bg-white shadow-lift" style={{ width: pageW, maxWidth: "100%" }}>
          <pdfLib.Document
            file={url}
            onLoadSuccess={({ numPages: n }: { numPages: number }) =>
              setNumPages(n)
            }
            onLoadError={() =>
              setError("This PDF could not be rendered here.")
            }
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
              width={pageW}
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

      {numPages > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-1 border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="pressable flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
            aria-label="Previous page"
          >
            <ChevronLeft size={17} />
          </button>
          <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="pressable text-xs text-muted px-1" aria-label="Zoom out">-</button>
        <span className="text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="pressable text-xs text-muted px-1" aria-label="Zoom in">+</button>
        <span className="tnum min-w-[4.5rem] text-center text-[12.5px] text-muted-foreground">
            {page} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="pressable flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
            aria-label="Next page"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
