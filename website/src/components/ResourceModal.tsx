"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Maximize2, X } from "lucide-react";
import { KIND_LABEL, kindOf } from "@/lib/file-kinds";
import Viewer from "@/components/viewers/Viewer";

interface ResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: { id: string; title: string; type: string; url: string; size?: string };
}

/**
 * The preview panel.
 *
 * It shows the same thing the full viewer shows, in a panel over the page.
 * The page behind is still there, which is the point of a panel: the student
 * is looking at a course and wants to glance at a file without losing their
 * place.
 */
export default function ResourceModal({
  open,
  onOpenChange,
  resource,
}: ResourceModalProps) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const kind = kindOf(resource);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

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
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={resource.title}
        className="modal-in relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border border-border bg-surface sm:h-auto sm:max-h-[88vh] sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-snug text-foreground">
              {resource.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                {KIND_LABEL[kind]}
              </span>
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <Viewer
            file={{
              id: resource.id,
              title: resource.title,
              url: resource.url,
              type: resource.type,
              size: resource.size,
            }}
            height="panel"
          />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-[11px] text-muted">Esc closes</span>

          <div className="flex items-center gap-2">
            <Link
              href={`/view/${encodeURIComponent(resource.id)}`}
              className="pressable inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <Maximize2 size={14} />
              Open full screen
            </Link>
            <a
              href={resource.url}
              download
              className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Download size={15} />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
