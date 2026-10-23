"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Download,
  FileArchive,
  FolderPlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import PixelMotif from "@/components/PixelMotif";
import {
  KIND_COLOUR,
  KIND_SHORT,
  MOTIF_TITLE,
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
import {
  createCourseFolder,
  deleteCourseFolder,
  moveCourseFile,
  removeCourseFile,
  renameCourseFile,
  renameCourseFolder,
  uploadCourseFile,
  type UploadState,
} from "@/app/admin/actions";

/**
 * The file manager.
 *
 * A course's material is a tree, and this is the editor for it: the
 * folders, the files inside them, and the ways to change both. It is the
 * shape of a file manager because that is the shape people already know how
 * to read, and because a lecturer putting a file in the right place should
 * not have to think about it.
 *
 * Two ways to do everything. A file can be dragged onto the folder it
 * belongs in, which is how a mouse does it, and every action also has a
 * button, which is how a finger does it. The drag is built on pointer
 * events rather than the browser's own dragging, because the browser's
 * dragging does not work on a touch screen.
 */

export interface FileRow {
  id: string;
  course: string;
  title: string;
  type: string;
  url: string;
  size: number | null;
  source: "archive" | "upload";
  folder?: string | null;
}

interface Props {
  courses: { code: string; title: string }[];
  files: FileRow[];
  /** The folders staff made, by course. */
  folders: Record<string, string[]>;
}

export default function FileManager({ courses, files, folders }: Props) {
  const router = useRouter();
  const [course, setCourse] = useState(courses[0]?.code ?? "");
  const [path, setPath] = useState("");
  const [rows, setRows] = useState<FileRow[]>(files);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [uploadState, uploadAction, uploading] = useActionStateShim();
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  /*
   * Adopt the list the server sends after a revalidation.
   *
   * `rows` is seeded once so that a move or a rename can be shown before the
   * server has answered. Without this, it would then keep showing the list
   * the page was opened with, and a folder made or a file added on another
   * device would never appear. The optimistic updates below still do the
   * immediate work; this replaces them with the server's answer.
   */
  useEffect(() => {
    setRows(files);
  }, [files]);

  // The drag. It is held in a ref as well as in state, because the pointer
  // handlers need the current value and a state update is not immediate.
  const [drag, setDrag] = useState<{
    id: string;
    title: string;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = useRef<typeof drag>(null);
  // A change event does not carry the modifier keys, so the pointer that
  // started the interaction leaves them here.
  const shiftRef = useRef(false);
  const overRef = useRef<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const courseFiles = useMemo(
    () => rows.filter((f) => f.course === course),
    [rows, course]
  );
  const courseFolders = folders[course] ?? [];

  const tree = useMemo(
    () => buildTree(courseFiles as FileNode[], courseFolders),
    [courseFiles, courseFolders]
  );
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

  /*
   * Put an uploaded file in the list, once.
   *
   * Both the picker and the drop zone end up here: the picker through the
   * state the action returns, and the drop zone through that same state, so
   * without the identity check a file would be added twice.
   */
  const addUploaded = useCallback(
    (file: NonNullable<UploadState["file"]>) => {
      setRows((r) =>
        r.some((f) => f.id === file.id)
          ? r
          : [
              {
                ...file,
                source: file.source as FileRow["source"],
                folder: file.folder ?? null,
              },
              ...r,
            ]
      );
    },
    []
  );

  /* ------------------------------------------------------------- the tree */

  const Tree = ({ node, depth }: { node: FolderNode; depth: number }) => {
    if (depth === 0) {
      return (
        <div>
          {node.children
            .filter((c) => c.kind === "folder")
            .map((c) => (
              <Tree key={(c as FolderNode).path} node={c as FolderNode} depth={1} />
            ))}
        </div>
      );
    }
    const child = node as FolderNode;
    const open = path === child.path || path.startsWith(`${child.path}/`);
    return (
      <div>
        <div
          data-drop-path={child.path}
          onPointerEnter={() => overRef.current === child.path || undefined}
          className={`group flex items-center gap-1.5 rounded px-2 py-1 text-[12.5px] transition-colors ${
            over === child.path
              ? "bg-accent/20 text-accent"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => setPath(child.path)}
            className="pressable flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <span className="w-3 shrink-0 text-[10px] text-muted">
              {open ? "▾" : "▸"}
            </span>
            <span className="truncate">{child.name}</span>
            <span className="tnum shrink-0 text-[10.5px] text-muted">
              {countFiles(child)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPath(child.path)}
            onPointerDown={() => {
              overRef.current = child.path;
            }}
            className="pressable shrink-0 rounded px-1 text-[10px] uppercase tracking-[0.08em] text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            title="Drop a file here to put it in this folder"
          >
            drop
          </button>
        </div>
        {open && (
          <div>
            {child.children
              .filter((c) => c.kind === "folder")
              .map((c) => (
                <Tree
                  key={(c as FolderNode).path}
                  node={c as FolderNode}
                  depth={depth + 1}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------- the drag itself */

  const beginDrag = useCallback(
    (file: FileRow, event: React.PointerEvent) => {
      if (event.button !== 0) return;

      const startX = event.clientX;
      const startY = event.clientY;
      const touch = event.pointerType === "touch";
      const startedAt = Date.now();
      let started = false;

      const element = event.currentTarget as HTMLElement;
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that cannot be captured is a pointer that has gone.
      }

      const onMove = (e: PointerEvent) => {
        if (!started) {
          const far = Math.hypot(e.clientX - startX, e.clientY - startY) > 8;
          // On a touch, a drag has to be a held drag, or every attempt to
          // scroll the list would pick a file up instead.
          if (!far) return;
          if (touch && Date.now() - startedAt < 250) return;
          started = true;
          dragRef.current = { id: file.id, title: file.title, x: e.clientX, y: e.clientY };
          setDrag(dragRef.current);
        }
        dragRef.current = { ...dragRef.current!, x: e.clientX, y: e.clientY };
        setDrag(dragRef.current);

        const under = document.elementFromPoint(e.clientX, e.clientY);
        const holder = under?.closest("[data-drop-path]");
        const path = holder?.getAttribute("data-drop-path") ?? null;
        overRef.current = path;
        setOver(path);
      };

      const onUp = async (e: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        try {
          element.releasePointerCapture(event.pointerId);
        } catch {
          // Already gone.
        }

        if (!started) return;

        // Where it was let go, rather than where the pointer last moved. A
        // finger that slides a little on the way up should still drop on
        // what it was over when it was released.
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const holder = under?.closest("[data-drop-path]");
        const drop = holder?.getAttribute("data-drop-path") ?? null;

        dragRef.current = null;
        overRef.current = null;
        setDrag(null);
        setOver(null);

        if (drop === null) return;
        await move(file.id, drop);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ------------------------------------------------------------- the moves */

  const move = async (id: string, to: string) => {
    setProblem(null);
    try {
      await moveCourseFile(id, to);
      setRows((r) => r.map((f) => (f.id === id ? { ...f, folder: to || null } : f)));
      setNotice(`Moved to ${to || "the top"}.`);
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The file could not be moved.");
    }
  };

  const rename = async (id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setProblem(null);
    try {
      await renameCourseFile(id, clean);
      setRows((r) => r.map((f) => (f.id === id ? { ...f, title: clean } : f)));
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The file could not be renamed.");
    }
  };

  const remove = async (id: string) => {
    setProblem(null);
    try {
      await removeCourseFile(id);
      setRows((r) => r.filter((f) => f.id !== id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The file could not be removed.");
    }
  };

  const makeFolder = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setProblem(null);
    try {
      await createCourseFolder(course, path ? `${path}/${clean}` : clean);
      setNewFolder(false);
      setNotice(`Made the folder ${clean}.`);
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The folder could not be made.");
    }
  };

  const removeFolder = async (folderPath: string) => {
    setProblem(null);
    try {
      await deleteCourseFolder(course, folderPath);
      setNotice("The folder was removed.");
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The folder could not be removed.");
    }
  };

  const renameFolder = async (from: string, to: string) => {
    const clean = to.trim();
    if (!clean) return;
    setProblem(null);
    try {
      await renameCourseFolder(course, from, clean);
      setNotice("The folder was renamed.");
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The folder could not be renamed.");
    }
  };

  /* ------------------------------------------------------------ the upload */

  const [dropping, setDropping] = useState(false);

  const uploadFiles = async (list: FileList | File[]) => {
    setProblem(null);

    for (const file of Array.from(list)) {
      const form = new FormData();
      form.set("course", course);
      form.set("folder", path);
      form.set("title", file.name.replace(/\.[^.]+$/, ""));
      form.set("file", file);

      const result = await uploadAction(form);

      // The action reports a rejected upload rather than throwing, so the
      // drop zone has to read the answer. Swallowing it meant a file that was
      // too big, or a store that refused it, disappeared without a word.
      if (result.error) {
        setProblem(result.error);
        return;
      }
      if (result.file) addUploaded(result.file);
    }
  };

  /* -------------------------------------------------------------- keyboard */

  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (renaming || newFolder) return;
      const target = e.target as HTMLElement | null;
      if (target && /input|select|textarea/i.test(target.tagName)) return;

      if (e.key === "Escape") {
        setSelected(new Set());
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size === 0) return;
        e.preventDefault();
        for (const id of selected) await remove(id);
        setSelected(new Set());
        return;
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSelected(new Set(filesHere.map((f) => f.id)));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, filesHere, renaming, newFolder]);

  const toggle = (id: string, additive: boolean) => {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      if (additive && prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---------------------------------------------------------------- render */

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
          Course files
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNewFolder((n) => !n)}
            className="pressable inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <FolderPlus size={14} className="text-accent" />
            New folder
          </button>
        </div>
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
        A file added here appears on the course page, in the search and in
        the counts within a request or two. Twenty-five megabytes is the
        limit. Drag a file onto a folder to move it there.
      </p>

      {/* The courses */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {courses.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => {
              setCourse(c.code);
              setPath("");
              setSelected(new Set());
            }}
            className={`pressable rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
              c.code === course
                ? "border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {(notice || problem) && (
        <p
          role="status"
          className={`mt-3 rounded-md border px-3 py-2 text-[12.5px] ${
            problem
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {problem ?? notice}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* The tree. On a wide screen it is a column beside the list. On a
            narrow one it is folded away behind a button, because a column
            beside the list would leave the list too narrow to read, and a
            file with nowhere to be dropped is a file manager with one
            gesture missing. The folders in the list are drop targets too, so
            the gesture is never taken away. */}
        <button
          type="button"
          onClick={() => setShowTree((s) => !s)}
          aria-expanded={showTree}
          className="pressable flex items-center justify-between rounded-md border border-border px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-hover lg:hidden"
        >
          Folders
          <span className="text-muted">{showTree ? "▾" : "▸"}</span>
        </button>

        <aside className={showTree ? "block" : "hidden lg:block"}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Folders
          </p>
          <div
            data-drop-path=""
            className={`mt-2 rounded-md border p-1.5 ${
              over === "" ? "border-accent bg-accent/10" : "border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => setPath("")}
              className={`pressable flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12.5px] transition-colors ${
                path === ""
                  ? "text-accent"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span className="w-3 text-[10px] text-muted">{path === "" ? "▾" : "▸"}</span>
              The top
              <span className="tnum ml-auto text-[10.5px] text-muted">
                {courseFiles.filter((f) => !f.folder).length}
              </span>
            </button>
            <Tree node={tree} depth={0} />
          </div>
          <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-muted">
            Drop a file on a folder to move it there.
          </p>
        </aside>

        {/* The list */}
        <div className="min-w-0">
          {/* The way down */}
          <nav
            aria-label="Folder"
            className="flex flex-wrap items-center gap-1 text-[12.5px]"
          >
            <button
              type="button"
              onClick={() => setPath("")}
              className="pressable rounded px-1.5 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {course}
            </button>
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

          {newFolder && (
            <form
              className="mt-3 flex items-center gap-2"
              action={(formData) => makeFolder(String(formData.get("name") ?? ""))}
            >
              <input
                name="name"
                autoFocus
                placeholder="Folder name"
                className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent"
              />
              <button
                type="submit"
                className="pressable inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[12.5px] font-medium text-accent-foreground"
              >
                <Check size={14} />
                Make it
              </button>
              <button
                type="button"
                onClick={() => setNewFolder(false)}
                className="pressable rounded-md px-2 py-2 text-[12.5px] text-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            </form>
          )}

          {/* The drop zone for uploading */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDropping(false);
              if (e.dataTransfer.files.length) {
                await uploadFiles(e.dataTransfer.files);
              }
            }}
            className={`mt-3 rounded-lg border border-dashed px-4 py-4 transition-colors ${
              dropping
                ? "border-accent bg-accent/10"
                : "border-border-strong bg-background"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] text-muted-foreground">
                Drop files here to add them to{" "}
                <span className="text-foreground">
                  {path ? `${course} / ${path}` : course}
                </span>
                .
              </p>
              <UploadForm
                course={course}
                path={path}
                state={uploadState}
                action={(formData) => void uploadAction(formData)}
                pending={uploading}
                onDone={(file) => {
                  if (file) addUploaded(file);
                }}
              />
            </div>

            {uploadState.error && (
              <p role="alert" className="mt-2 text-[12px] text-red-300">
                {uploadState.error}
              </p>
            )}
          </div>

          {/* What is here */}
          {foldersHere.length === 0 && filesHere.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border-strong p-8 text-center text-[13px] text-muted-foreground">
              Nothing in this folder.
            </p>
          ) : (
            <ul ref={listRef} className="mt-4 divide-y divide-border border-y border-border">
              {foldersHere.map((folder) => (
                <li
                  key={folder.path}
                  data-drop-path={folder.path}
                  className={`flex items-center gap-3 py-2 transition-colors ${
                    over === folder.path ? "bg-accent/10" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPath(folder.path)}
                    className="pressable flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="w-6 shrink-0">
                      <PixelMotif
                        kind="folder"
                        title="A folder with a tab on the top left and a body with a label on it"
                        className="h-5 w-5"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {folder.name}
                      </span>
                      <span className="tnum block text-[11px] text-muted">
                        {countFiles(folder)} file
                        {countFiles(folder) === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFolder(folder.path)}
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                  >
                    Remove
                  </button>
                </li>
              ))}

              {filesHere.map((file) => {
                const kind: ViewerKind = kindOf(file);
                const checked = selected.has(file.id);
                return (
                  <li
                    key={file.id}
                    className={`flex items-center gap-3 py-2 transition-colors ${
                      checked ? "bg-accent/8" : ""
                    }`}
                    onPointerDown={(e) => {
                      shiftRef.current = e.shiftKey;
                      beginDrag(file as FileRow, e);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(file.id, shiftRef.current)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-[#22c55e]"
                      aria-label={`Select ${file.title}`}
                    />

                    <span className="w-6 shrink-0">
                      <PixelMotif
                        kind={motifFor(kind)}
                        title={MOTIF_TITLE[kind]}
                        className="h-5 w-5"
                      />
                    </span>

                    {renaming === file.id ? (
                      <input
                        autoFocus
                        defaultValue={file.title}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void rename(file.id, (e.target as HTMLInputElement).value);
                            setRenaming(null);
                          }
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        onBlur={(e) => {
                          void rename(file.id, e.currentTarget.value);
                          setRenaming(null);
                        }}
                        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent"
                      />
                    ) : (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-foreground">
                          {file.title}
                        </span>
                        <span className="block text-[11px] text-muted">
                          {KIND_SHORT[kind]}
                          {file.source === "archive" ? " · in the repository" : ""}
                        </span>
                      </span>
                    )}

                    {file.source === "upload" ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRenaming(file.id)}
                          className="pressable rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                        >
                          Rename
                        </button>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value !== "") void move(file.id, e.target.value);
                          }}
                          className="pressable rounded border border-border bg-background px-1.5 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                          aria-label={`Move ${file.title} to another folder`}
                        >
                          <option value="">Move to</option>
                          {allFolderPaths(tree).map((p) => (
                            <option key={p} value={p}>
                              {p || "The top"}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => remove(file.id)}
                          className="pressable rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      <span
                        className="shrink-0 text-[11px] text-muted"
                        title="This file lives in the repository and is served from the site's own folder, so it cannot be removed from here."
                      >
                        in the repository
                      </span>
                    )}

                    <a
                      href={resourceUrl(file.url)}
                      download
                      className="pressable shrink-0 rounded p-1.5 text-muted transition-colors hover:text-foreground"
                      aria-label={`Download ${file.title}`}
                    >
                      <Download size={14} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {selected.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <span className="text-[12px] text-muted-foreground">
                {selected.size} selected
              </span>
              <select
                value=""
                onChange={async (e) => {
                  if (e.target.value === "") return;
                  for (const id of selected) await move(id, e.target.value);
                  setSelected(new Set());
                }}
                className="pressable rounded border border-border bg-surface px-2 py-1 text-[12px] text-foreground"
                aria-label="Move the selected files to a folder"
              >
                <option value="">Move the selected to</option>
                {allFolderPaths(tree).map((p) => (
                  <option key={p} value={p}>
                    {p || "The top"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={async () => {
                  for (const id of selected) await remove(id);
                  setSelected(new Set());
                }}
                className="pressable inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
              >
                <Trash2 size={13} />
                Remove
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="pressable ml-auto rounded px-2 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The thing being dragged. */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-md border border-accent/40 bg-surface px-3 py-1.5 text-[12.5px] text-foreground shadow-lift"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          <FileArchive size={14} className="text-accent" />
          {drag.title}
        </div>
      )}
    </section>
  );
}

/** Every folder in a tree, with the paths. */
function allFolderPaths(tree: FolderNode): string[] {
  const out = [""];
  const walk = (node: FolderNode) => {
    for (const child of node.children) {
      if (child.kind !== "folder") continue;
      out.push(child.path);
      walk(child);
    }
  };
  walk(tree);
  return out;
}

/** The upload form, in its own component so the file manager stays readable. */
function UploadForm({
  course,
  path,
  state,
  action,
  pending,
  onDone,
}: {
  course: string;
  path: string;
  state: UploadState;
  action: (formData: FormData) => void;
  pending: boolean;
  onDone: (file: UploadState["file"]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.file) onDone(state.file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.file]);

  return (
    <form
      action={action}
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        data.set("course", course);
        data.set("folder", path);
        action(data);
        form.reset();
      }}
    >
      <input type="hidden" name="course" value={course} />
      <input type="hidden" name="folder" value={path} />
      <input
        ref={inputRef}
        type="file"
        name="file"
        className="sr-only"
        onChange={(e) => {
          const form = e.currentTarget.form;
          if (!form) return;
          const data = new FormData(form);
          action(data);
          e.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="pressable inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Upload size={13} />
        )}
        {pending ? "Adding" : "Choose a file"}
      </button>
    </form>
  );
}

/**
 * A small wrapper so the component can hold the upload state without
 * importing the hook twice.
 */
function useActionStateShim(): [
  UploadState,
  (formData: FormData) => Promise<UploadState>,
  boolean,
] {
  const [state, setState] = useState<UploadState>({});
  const [pending, setPending] = useState(false);

  const action = useCallback(async (formData: FormData): Promise<UploadState> => {
    setPending(true);
    // Clear the last answer first, so an error from one file is not still on
    // the screen while the next one is being added.
    setState({});

    try {
      const result = await uploadCourseFile({}, formData);
      setState(result);
      return result;
    } catch (e) {
      /*
       * The action itself can reject before it can report anything: the
       * connection drops, the deployment is being replaced, the session has
       * gone. The old shim let that rejection escape, so the button stopped
       * spinning and nothing else happened.
       */
      const result: UploadState = {
        error:
          e instanceof Error
            ? e.message
            : "The file could not be added. Check your connection and try again.",
      };
      setState(result);
      return result;
    } finally {
      setPending(false);
    }
  }, []);

  return [state, action, pending];
}
