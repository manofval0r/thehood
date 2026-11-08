"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  MessageSquarePlus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CommentsProvider, useCommentsContext } from "./comments-context";
import CommentBadge from "./CommentBadge";
import { cn } from "@/lib/utils";

/**
 * A PDF, read page by page.
 *
 * The worker is served from the site's own folder rather than from a
 * content delivery network, so nothing about the reader leaves here. It is
 * loaded only when a PDF is actually opened, because it is a megabyte of
 * JavaScript and most readers will never ask for one.
 *
 * Annotation lives on the page itself: the badge sits in the top-right
 * corner of the paper, where a reader can see it without it eating the text.
 * Hidden until toggled or once a comment exists.
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
  const [annotate, setAnnotate] = useState(false);

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

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) setInnerW(el.clientWidth - 32);
  }, []);

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
    <CommentsProvider fileId={url} fileKind="pdf">
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={containerRef} className="flex min-h-0 flex-1 justify-start overflow-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto" style={{ width: pageW, maxWidth: "100%" }}>
            <div className="relative rounded border border-border bg-white shadow-lift">
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
              <PageBadge page={page} annotate={annotate} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setAnnotate((v) => !v)}
            aria-pressed={annotate}
            className={cn(
              "pressable flex h-9 items-center gap-1.5 rounded-md px-2 text-[11.5px] font-medium transition-colors max-sm:h-11 max-sm:px-3",
              annotate
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <MessageSquarePlus size={14} aria-hidden="true" />
            {annotate ? "Annotating" : "Annotate"}
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:h-11 max-sm:w-11"
              aria-label="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="tnum w-10 text-center text-[11px] text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:h-11 max-sm:w-11"
              aria-label="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {numPages > 1 ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>
              <span className="tnum min-w-[4.5rem] text-center text-[12.5px] text-muted-foreground">
                {page} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                disabled={page >= numPages}
                className="pressable grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          ) : (
            <span className="tnum min-w-[3rem] text-center text-[11px] text-muted">1 page</span>
          )}
        </div>
      </div>
    </CommentsProvider>
  );
}

function PageBadge({ page, annotate }: { page: number; annotate: boolean }) {
  const { comments } = useCommentsContext();
  const count = comments.filter(
    (c) =>
      c.comment.target_type === "page" &&
      JSON.stringify(c.comment.target_selector) === JSON.stringify({ page })
  ).length;
  if (count === 0 && !annotate) return null;
  return (
    <span className="absolute right-2 top-2 z-10">
      <CommentBadge
        targetType="page"
        targetSelector={{ page }}
        label={`Page ${page} comments`}
        annotate={annotate}
      />
    </span>
  );
}
