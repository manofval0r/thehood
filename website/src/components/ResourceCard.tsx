"use client";

import Link from "next/link";
import { Download, Eye, Maximize2 } from "lucide-react";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import {
  KIND_COLOUR,
  KIND_SHORT,
  MOTIF_TITLE,
  canView,
  kindOf,
  motifFor,
  type ViewerKind,
} from "@/lib/file-kinds";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: { id: string; title: string; type: string; url: string; size?: string };
  href: string;
  onPreview?: (id: string) => void;
  index?: number;
}

/**
 * Resource card.
 *
 * The mark is drawn per kind of file rather than pulled from an icon set, so
 * the card reads as the thing it is at a glance. The tile is large enough to
 * carry that: a 16px glyph in the corner was decoration, not information.
 *
 * A preview is offered for anything there is a viewer for, which is now most
 * things: a deck, a spreadsheet, a table of evidence, a message. The big
 * viewer is a link away for whoever wants the whole screen.
 */
export default function ResourceCard({
  resource,
  href,
  onPreview,
  index = 0,
}: ResourceCardProps) {
  const kind: ViewerKind = kindOf(resource);
  const colour = KIND_COLOUR[kind];
  const previewable = canView(kind) && !!onPreview;

  return (
    <AppleCard maxTilt={5} className="h-full">
      <div
        className="card-tilt settle relative flex h-full flex-col rounded-lg border border-border bg-surface p-5"
        style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
      >
        <span className="card-cast" aria-hidden="true" />
        <span className="card-accent-glow" aria-hidden="true" />
        <span className="card-bevel" aria-hidden="true" />

        <div
          className="card-depth flex items-start justify-between gap-4"
          style={{ "--depth": "14px" } as React.CSSProperties}
        >
          {/* The kind of file, drawn. */}
          <span
            className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${colour}1f` }}
          >
            <span className="h-8 w-7">
              <PixelMotif
                kind={motifFor(kind)}
                title={MOTIF_TITLE[kind]}
                className="h-full w-full"
              />
            </span>
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded px-1 font-mono text-[8px] font-bold tracking-tight"
              style={{ background: colour, color: "#0a0a0a" }}
            >
              {KIND_SHORT[kind]}
            </span>
          </span>

          {previewable && (
            <span className="mt-1 shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Preview
            </span>
          )}
        </div>

        <h4
          className="card-depth mt-4 text-[14px] font-medium leading-snug text-foreground"
          style={{ "--depth": "30px" } as React.CSSProperties}
        >
          {resource.title}
        </h4>

        <div
          className="card-depth mt-auto flex flex-wrap items-center gap-2 pt-5"
          style={{ "--depth": "10px" } as React.CSSProperties}
        >
          {previewable && (
            <button
              type="button"
              onClick={() => onPreview?.(resource.id)}
              className="pressable inline-flex items-center gap-1.5 rounded-md bg-surface-hover px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              <Eye size={14} />
              Preview
            </button>
          )}
          <Link
            href={`/view/${encodeURIComponent(resource.id)}`}
            className={cn(
              "pressable inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
              previewable
                ? "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                : "bg-surface-hover text-foreground hover:bg-surface-raised"
            )}
          >
            <Maximize2 size={14} />
            Open
          </Link>
          <Link
            href={href}
            download
            className={cn(
              "pressable ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
              previewable
                ? "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
          >
            <Download size={14} />
            Download
          </Link>
        </div>
      </div>
    </AppleCard>
  );
}
