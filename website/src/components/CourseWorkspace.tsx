"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Download, FileArchive, FolderPlus, Loader2 } from "lucide-react";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import ResourceCard from "@/components/ResourceCard";
import ResourceModal from "@/components/ResourceModal";
import {
  KIND_COLOUR,
  KIND_SHORT,
  MOTIF_TITLE,
  canView,
  kindOf,
  motifFor,
  type ViewerKind,
} from "@/lib/file-kinds";
import {
  buildTree,
  contentsAt,
  countFiles,
  pathChain,
  type FileNode,
  type FolderNode,
} from "@/lib/file-tree";
import { resourceUrl } from "@/lib/resources";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * The workspace.
 *
 * A course's material is a tree, and this is the browser for it: the
 * folders, the files inside them, the way down, and a way back up. It is
 * the same shape as a code browser, because that shape is what people
 * already know how to read.
 *
 * Nothing here needs an account. The files are the course's, and they are
 * there to be read.
 */
export default function CourseWorkspace({
  courseCode,
  courseSlug,
  files,
  folders,
}: {
  courseCode: string;
  courseSlug: string;
  files: FileNode[];
  folders: string[];
}) {
  const [path, setPath] = useState("");
  const [filter, setFilter] = useState<ViewerKind | "all">("all");
  const [preview, setPreview] = useState<FileNode | null>(null);
  const [zipping, setZipping] = useState(false);

  /**
   * Search can deep-link straight to a file: /courses/<slug>?r=<fileId>.
   *
   * The address is read from the window rather than with `useSearchParams`,
   * because a component that reads the address is a hole in the page: the
   * whole workspace would be sent from the browser instead of with the
   * page, and a student on a phone would wait for the script before seeing
   * a single file.
   */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("r");
    if (!wanted) return;
    const file = files.find((f) => f.id === wanted);
    if (!file) return;
    setPreview(file);
    if (file.folder) setPath(file.folder);
  }, [files]);

  const tree = useMemo(() => buildTree(files, folders), [files, folders]);
  const here = useMemo(() => contentsAt(tree, path), [tree, path]);
  const chain = useMemo(() => pathChain(path), [path]);

  const foldersHere = here.filter(
    (n): n is FolderNode => n.kind === "folder"
  );
  const filesHere = useMemo(
    () =>
      here
        .filter((n) => n.kind === "file")
        .map((n) => (n as { kind: "file"; file: FileNode }).file),
    [here]
  );

  // The kinds in this folder, so the filter row only offers what is here.
  const kindsHere = useMemo(() => {
    const seen = new Map<ViewerKind, ViewerKind>();
    for (const file of filesHere) {
      const kind = kindOf(file);
      if (!seen.has(kind)) seen.set(kind, kind);
    }
    return [...seen.keys()];
  }, [filesHere]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? filesHere
        : filesHere.filter((f) => kindOf(f) === filter),
    [filesHere, filter]
  );

  const previewFile = preview;

  /** The files under a path, at any depth. */
  const filesUnder = (node: FolderNode): FileNode[] => {
    const out: FileNode[] = [];
    for (const child of node.children) {
      if (child.kind === "folder") out.push(...filesUnder(child));
      else out.push(child.file);
    }
    return out;
  };

  const downloadFolder = async (folderPath: string) => {
    const node = contentsAt(tree, folderPath).find(
      (n): n is FolderNode => n.kind === "folder"
    );
    const list = node ? filesUnder(node) : filesHere;
    if (list.length === 0) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        list.map(async (file) => {
          const res = await fetch(resourceUrl(file.url));
          if (!res.ok) return;
          const blob = await res.blob();
          const name = file.url.split("/").pop() || file.title;
          const path = file.folder ? `${file.folder}/${name}` : name;
          zip.file(`${courseCode.replace(/\s+/g, "_")}/${path}`, blob);
        })
      );
      const label = folderPath
        ? folderPath.split("/").pop()
        : courseCode.replace(/\s+/g, "_");
      saveAs(await zip.generateAsync({ type: "blob" }), `${label}.zip`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <section className="pb-16">
      <div className="flex flex-col gap-5 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Resources
            <span className="tnum ml-2.5 text-lg font-normal text-muted-foreground">
              {files.length}
            </span>
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {foldersHere.length > 0
              ? `${foldersHere.length} folder${foldersHere.length === 1 ? "" : "s"} and ${visible.length} file${visible.length === 1 ? "" : "s"} here`
              : `${visible.length} file${visible.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {kindsHere.length > 1 && (
            <div
              role="tablist"
              aria-label="Filter files by type"
              className="flex flex-wrap gap-1.5"
            >
              <FilterPill
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All"
              />
              {kindsHere.map((kind) => (
                <FilterPill
                  key={kind}
                  active={filter === kind}
                  onClick={() => setFilter(kind)}
                  label={KIND_SHORT[kind]}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => downloadFolder(path)}
            disabled={zipping || filesHere.length === 0}
            className="pressable inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {zipping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileArchive size={14} className="text-accent" />
            )}
            {path ? "Download this folder" : "Download everything"}
          </button>
        </div>
      </div>

      {/* The way down and the way back up. */}
      <nav
        aria-label="Folder"
        className="mt-5 flex flex-wrap items-center gap-1 text-[12.5px]"
      >
        <Link
          href={`/courses/${courseSlug}`}
          className="pressable rounded px-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {courseCode}
        </Link>
        {chain.slice(1).map((part) => (
          <span key={part} className="flex items-center gap-1">
            <ChevronRight size={13} className="text-muted" />
            <button
              type="button"
              onClick={() => setPath(part)}
              className="pressable rounded px-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {part.split("/").pop()}
            </button>
          </span>
        ))}
      </nav>

      {/* What is here. */}
      {foldersHere.length === 0 && visible.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-12 text-center">
          <span className="mx-auto block w-10 opacity-80">
            <PixelMotif
              kind="folder"
              title="A folder with a tab on the top left and a body with a label on it"
            />
          </span>
          <h3 className="mt-4 text-[15px] font-semibold text-foreground">
            {path ? "Nothing in this folder" : "Nothing here yet"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
            {path
              ? "Whatever is put in this folder appears here."
              : "Lecture notes for this course appear here as soon as the lecturer adds them."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foldersHere.map((folder) => (
            <FolderCard
              key={folder.path}
              folder={folder}
              onOpen={() => setPath(folder.path)}
            />
          ))}

          {visible.map((file, i) => (
            <ResourceCard
              key={file.id}
              resource={{
                id: file.id,
                title: file.title,
                type: file.type,
                url: resourceUrl(file.url),
                size: undefined,
              }}
              href={resourceUrl(file.url)}
              onPreview={(id) => setPreview(filesHere.find((f) => f.id === id) ?? null)}
              index={i}
            />
          ))}
        </div>
      )}

      {previewFile && (
        <ResourceModal
          open
          onOpenChange={(o) => !o && setPreview(null)}
          resource={{
            id: previewFile.id,
            title: previewFile.title,
            type: previewFile.type,
            url: resourceUrl(previewFile.url),
          }}
        />
      )}
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`pressable rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/** A folder, drawn. */
function FolderCard({
  folder,
  onOpen,
}: {
  folder: FolderNode;
  onOpen: () => void;
}) {
  const count = countFiles(folder);

  return (
    <AppleCard maxTilt={5} className="h-full">
      <button
        type="button"
        onClick={onOpen}
        className="card-tilt settle relative flex h-full w-full flex-col rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong"
      >
        <span className="card-cast" aria-hidden="true" />
        <span className="card-accent-glow" aria-hidden="true" />
        <span className="card-bevel" aria-hidden="true" />

        <div
          className="card-depth flex items-start justify-between gap-4"
          style={{ "--depth": "14px" } as React.CSSProperties}
        >
          <span
            className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${KIND_COLOUR.unknown}1f` }}
          >
            <span className="h-8 w-7">
              <PixelMotif
                kind="folder"
                title="A folder with a tab on the top left and a body with a label on it"
                className="h-full w-full"
              />
            </span>
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded px-1 font-mono text-[8px] font-bold tracking-tight"
              style={{ background: KIND_COLOUR.unknown, color: "#0a0a0a" }}
            >
              DIR
            </span>
          </span>

          <span className="mt-1 shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {count} {count === 1 ? "file" : "files"}
          </span>
        </div>

        <h4
          className="card-depth mt-4 text-[14px] font-medium leading-snug text-foreground"
          style={{ "--depth": "30px" } as React.CSSProperties}
        >
          {folder.name}
        </h4>

        <div
          className="card-depth mt-auto pt-5"
          style={{ "--depth": "10px" } as React.CSSProperties}
        >
          <span className="pressable inline-flex items-center gap-1.5 rounded-md bg-surface-hover px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-raised">
            Open
          </span>
        </div>
      </button>
    </AppleCard>
  );
}
