"use client";

import { Download, FileText } from "lucide-react";
import {
  KIND_LABEL,
  MOTIF_TITLE,
  kindOf,
  motifFor,
  type ViewerKind,
} from "@/lib/file-kinds";
import PixelMotif from "@/components/PixelMotif";
import PdfViewer from "./PdfViewer";
import SlidesViewer from "./SlidesViewer";
import TextViewer from "./TextViewer";
import JsonViewer from "./JsonViewer";
import CsvViewer from "./CsvViewer";
import EmailViewer from "./EmailViewer";

export interface ViewerFile {
  id: string;
  title: string;
  url: string;
  type?: string;
  size?: string;
}

/**
 * The one viewer, which knows how to show each kind of file.
 *
 * There is a page for it and a panel for it, and both call this. A viewer
 * written twice is a viewer that is right in one place and wrong in the
 * other.
 */
export default function Viewer({
  file,
  height = "full",
}: {
  file: ViewerFile;
  /** "full" fills the frame, "panel" is the height of a modal body. */
  height?: "full" | "panel";
}) {
  const kind = kindOf(file);

  const body = () => {
    switch (kind) {
      case "pdf":
        return <PdfViewer url={file.url} title={file.title} />;
      case "slides":
        return <SlidesViewer url={file.url} title={file.title} />;
      case "json":
        return <JsonViewer url={file.url} />;
      case "csv":
        return <CsvViewer url={file.url} />;
      case "email":
        return <EmailViewer url={file.url} />;
      case "text":
        return <TextViewer url={file.url} />;
      case "image":
        return (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[repeating-conic-gradient(var(--surface)_0%_25%,var(--background)_0%_50%)] bg-[length:20px_20px] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        );
      default:
        return <NothingToShow kind={kind} file={file} />;
    }
  };

  return (
    <div
      className={`flex flex-col bg-background ${
        height === "full" ? "min-h-0 flex-1" : "min-h-[24rem]"
      }`}
    >
      {body()}
    </div>
  );
}

function NothingToShow({
  kind,
  file,
}: {
  kind: ViewerKind;
  file: ViewerFile;
}) {
  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center gap-5 p-12 text-center">
      <div className="w-16">
        <PixelMotif
          kind={motifFor(kind)}
          title={MOTIF_TITLE[kind]}
          className="opacity-90"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {kind === "sheet" || kind === "word"
            ? "This opens in an office application"
            : "There is nothing to preview here"}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {kind === "sheet" || kind === "word"
            ? "Download the file and open it in Excel, Word, or the copy you already have."
            : "The file is here to be downloaded rather than read on the page."}
        </p>
      </div>
      <a
        href={file.url}
        download
        className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        <Download size={15} />
        Download {KIND_LABEL[kind].toLowerCase()}
      </a>
    </div>
  );
}

/** A small badge showing the kind of a file, in the site's pixel language. */
export function KindBadge({
  file,
  className = "",
}: {
  file: ViewerFile;
  className?: string;
}) {
  const kind = kindOf(file);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent ${className}`}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

/** A motif on its own, for a place that wants the shape without the word. */
export function KindMark({
  file,
  className = "w-8",
}: {
  file: ViewerFile;
  className?: string;
}) {
  const kind = kindOf(file);
  return (
    <span className={`inline-block ${className}`}>
      <PixelMotif kind={motifFor(kind)} title={MOTIF_TITLE[kind]} />
    </span>
  );
}

/** The word for a file's kind, without the badge around it. */
export function kindWord(file: ViewerFile): string {
  return KIND_LABEL[kindOf(file)];
}

/** An empty state for a panel that has nothing in it. */
export function EmptyViewer() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 p-10 text-center">
      <FileText size={32} className="text-muted" />
      <p className="text-sm text-muted-foreground">Nothing to show</p>
    </div>
  );
}
