"use client";

import Link from "next/link";
import { Download, Eye, FileText, Presentation, Tablet, FileCode } from "lucide-react";
import { resourceUrl } from "@/lib/resources";
import AppleCard from "@/components/AppleCard";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  pdf: FileText,
  pptx: Presentation,
  xlsx: Tablet,
  doc: FileCode,
  other: FileText,
};

const TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  pptx: "Slides",
  xlsx: "Sheet",
  doc: "Document",
  other: "File",
};

const TYPE_TONE: Record<string, string> = {
  pdf: "text-tone-exams",
  pptx: "text-tone-ceremony",
  xlsx: "text-tone-academic",
  doc: "text-tone-statutory",
  other: "text-muted-foreground",
};

interface ResourceCardProps {
  resource: { id: string; title: string; type: string; url: string; size?: string };
  onPreview?: (id: string) => void;
  index?: number;
}

export default function ResourceCard({
  resource,
  onPreview,
  index = 0,
}: ResourceCardProps) {
  const Icon = TYPE_ICON[resource.type] || FileText;
  const canPreview = resource.type === "pdf" && !!onPreview;
  const href = resourceUrl(resource.url);

  return (
    <AppleCard maxTilt={5} className="h-full">
      <div
        className={cn(
          "card-tilt settle flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface p-5"
        )}
        style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
      >
        <span className="card-accent-glow" aria-hidden="true" />
        <span className="card-bevel" aria-hidden="true" />

        <div className="card-depth flex items-start justify-between gap-3" style={{ "--depth": "12px" } as React.CSSProperties}>
          <span
            className={cn(
              "font-mono text-[11px] font-bold uppercase tracking-[0.08em]",
              TYPE_TONE[resource.type]
            )}
          >
            {TYPE_LABEL[resource.type]}
          </span>
          <Icon
            size={17}
            strokeWidth={1.75}
            className="card-depth shrink-0 text-muted"
            style={{ "--depth": "22px" } as React.CSSProperties}
          />
        </div>

        <h4
          className="card-depth mt-3.5 text-[14px] font-medium leading-snug text-foreground"
          style={{ "--depth": "30px" } as React.CSSProperties}
        >
          {resource.title}
        </h4>

        <div
          className="card-depth mt-auto flex items-center gap-2 pt-5"
          style={{ "--depth": "10px" } as React.CSSProperties}
        >
          {canPreview && (
            <button
              onClick={() => onPreview?.(resource.id)}
              className="pressable inline-flex items-center gap-1.5 rounded-md bg-surface-hover px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              <Eye size={14} />
              Preview
            </button>
          )}
          <Link
            href={href}
            download
            className={cn(
              "pressable ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-colors",
              canPreview
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