"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Check,
  ChevronRight,
  Download,
  FileArchive,
  Folder,
  FolderPlus,
  FolderUp,
  GripVertical,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import PixelMotif from "@/components/PixelMotif";
import {
  KIND_SHORT,
  MOTIF_TITLE,
  kindOf,
  motifFor,
  type ViewerKind,
} from "@/lib/file-kinds";
import {
  buildTree,
  cleanPath,
  contentsAt,
  folderName,
  parentPath,
  pathChain,
  type FileNode,
  type FolderNode,
} from "@/lib/file-tree";
import { resourceUrl } from "@/lib/resources";
import {
  announceCourseFolder,
  createCourseFolder,
  createCourseFolders,
  deleteCourseFolder,
  moveCourseFile,
  moveCourseFolder,
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

/** What is being dragged: a file from the list, or a folder from the tree. */
type DragPayload =
  | { kind: "file"; id: string; title: string }
  | { kind: "folder"; path: string; title: string };

/** A file and the path it had on the device, before it was picked. */
interface UploadEntry {
  file: File;
  relativePath: string;
}

interface Props {
  /** The course the manager is working on, chosen once for both tabs. */
  course: string;
  /** The full name, so the course is never identified by its code alone. */
  courseTitle: string;
  files: FileRow[];
  /** The folders staff made, by course. */
  folders: Record<string, string[]>;
}

export default function FileManager({
  course,
  courseTitle,
  files,
  folders,
}: Props) {
  const router = useRouter();
  const [path, setPath] = useState("");
  const [rows, setRows] = useState<FileRow[]>(files);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [uploadState, uploadAction, uploading] = useActionStateShim();
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [folderBusy, setFolderBusy] = useState<string | null>(null);
  const [folderUpload, setFolderUpload] = useState<{
    label: string;
    done: number;
    total: number;
  } | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  /*
   * `webkitdirectory` is not a React prop, and the attribute has to exist
   * before the input is opened. Setting it here also lets Playwright see a
   * directory picker, which is how the upload path is tested.
   */
  useEffect(() => {
    const input = folderInputRef.current;
    if (!input) return;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
  }, []);

  // The drag. It is held in a ref as well as in state, because the pointer
  // handlers need the current value and a state update is not immediate.
  const [drag, setDrag] = useState<
    (DragPayload & { x: number; y: number }) | null
  >(null);
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
  const courseFolders = useMemo(() => folders[course] ?? [], [folders, course]);

  const tree = useMemo(
    () => buildTree(courseFiles as FileNode[], courseFolders),
    [courseFiles, courseFolders]
  );

  /*
   * Count every folder once. The tree rows and the folder rows both show a
   * count, and a drag re-renders them on every pointer move; counting each
   * subtree again there would turn a smooth move into a stutter.
   */
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const walk = (node: FolderNode): number => {
      let total = 0;
      for (const child of node.children) {
        if (child.kind === "folder") total += walk(child);
        else total += 1;
      }
      counts.set(node.path, total);
      return total;
    };
    walk(tree);
    return counts;
  }, [tree]);

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
    const childFolders = child.children.filter(
      (node): node is FolderNode => node.kind === "folder"
    );
    const open = path === child.path || path.startsWith(`${child.path}/`);
    const active = path === child.path;
    return (
      <div>
        <div
          data-drop-path={child.path}
          className={`group flex items-center gap-1.5 rounded px-2 py-1 text-[12.5px] transition-colors ${
            over === child.path
              ? "bg-accent/20 text-accent"
              : active
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <button
            type="button"
            onClick={() => setPath(child.path)}
            aria-current={active ? "page" : undefined}
            title={child.path}
            className="pressable flex min-w-0 flex-1 items-center gap-1.5 text-left"
          >
            <span className="w-3 shrink-0 text-[10px] text-muted">
              {childFolders.length > 0 ? (open ? "▾" : "▸") : null}
            </span>
            <span className="min-w-0 flex-1 truncate">{child.name}</span>
            <span className="tnum shrink-0 text-[10.5px] text-muted">
              {folderCounts.get(child.path) ?? 0}
            </span>
          </button>
          <button
            type="button"
            aria-label={`Drag ${child.name} to move it`}
            title="Drag to move"
            onPointerDown={(event) =>
              beginDrag(
                { kind: "folder", path: child.path, title: child.name },
                event
              )
            }
            className="pressable shrink-0 cursor-grab touch-none rounded p-1 text-muted opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100"
          >
            {folderBusy === child.path ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <GripVertical size={12} />
            )}
          </button>
        </div>
        {open && childFolders.length > 0 && (
          <div>
            {childFolders.map((node) => (
              <Tree
                key={node.path}
                node={node}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------- the drag itself */

  const beginDrag = (item: DragPayload, event: React.PointerEvent) => {
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

    /*
     * The folder a pointer is over, unless that folder is the one being
     * dragged or a child of it. A folder cannot be put inside itself, and
     * the row under the finger would otherwise light up as a target.
     */
    const targetAt = (x: number, y: number): string | null => {
      const under = document.elementFromPoint(x, y);
      const holder = under?.closest("[data-drop-path]");
      const drop = holder?.getAttribute("data-drop-path") ?? null;
      if (drop === null) return null;
      if (
        item.kind === "folder" &&
        (drop === item.path || drop.startsWith(`${item.path}/`))
      ) {
        return null;
      }
      return drop;
    };

    const onMove = (e: PointerEvent) => {
      if (!started) {
        const far = Math.hypot(e.clientX - startX, e.clientY - startY) > 8;
        // A file row is also the scroll surface, so on a touch it has to be
        // a held drag. A folder grip is an explicit handle: it can start at
        // once, the way a file manager's handle does.
        if (!far) return;
        if (touch && item.kind === "file" && Date.now() - startedAt < 250) {
          return;
        }
        started = true;
        dragRef.current = { ...item, x: e.clientX, y: e.clientY };
        setDrag(dragRef.current);
      }
      dragRef.current = { ...dragRef.current!, x: e.clientX, y: e.clientY };
      setDrag(dragRef.current);

      const drop = targetAt(e.clientX, e.clientY);
      overRef.current = drop;
      setOver(drop);
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
      const drop = targetAt(e.clientX, e.clientY);

      dragRef.current = null;
      overRef.current = null;
      setDrag(null);
      setOver(null);

      if (drop === null) return;
      if (item.kind === "file") await move(item.id, drop);
      else await moveFolderTo(item.path, drop);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

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
    const clean = cleanPath(name);
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
    setFolderBusy(folderPath);
    try {
      await deleteCourseFolder(course, folderPath);
      setPath((current) =>
        current === folderPath || current.startsWith(`${folderPath}/`)
          ? parentPath(folderPath)
          : current
      );
      setRenamingFolder(null);
      setNotice("The folder was removed.");
      router.refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The folder could not be removed.");
    } finally {
      setFolderBusy(null);
    }
  };

  /*
   * A folder move keeps the view with the folder. If the person is standing
   * inside the folder they moved, they should still be inside it after it
   * lands somewhere else, not looking at the old address.
   */
  const moveFolderTo = async (from: string, toParent: string) => {
    if (toParent === from || toParent.startsWith(`${from}/`)) {
      setProblem("A folder cannot be moved inside itself.");
      return;
    }
    if (parentPath(from) === toParent) return;

    setProblem(null);
    setFolderBusy(from);
    try {
      await moveCourseFolder(course, from, toParent);
      const target = toParent ? `${toParent}/${folderName(from)}` : folderName(from);
      setPath((current) => relocatePath(current, from, target));
      setNotice(`Moved ${folderName(from)} to ${toParent || "the top"}.`);
      router.refresh();
    } catch (e) {
      setProblem(
        e instanceof Error ? e.message : "The folder could not be moved."
      );
    } finally {
      setFolderBusy(null);
    }
  };

  const renameFolderTo = async (from: string, nextName: string) => {
    const name = cleanPath(nextName);
    if (!name) {
      setProblem("A folder needs a name.");
      return;
    }
    if (name.includes("/")) {
      setProblem("A folder name cannot contain a slash.");
      return;
    }
    if (name === folderName(from)) {
      setRenamingFolder(null);
      return;
    }

    setProblem(null);
    setFolderBusy(from);
    try {
      await renameCourseFolder(course, from, name);
      const target = parentPath(from) ? `${parentPath(from)}/${name}` : name;
      setPath((current) => relocatePath(current, from, target));
      setRenamingFolder(null);
      setNotice(`Renamed the folder to ${name}.`);
      router.refresh();
    } catch (e) {
      setProblem(
        e instanceof Error ? e.message : "The folder could not be renamed."
      );
    } finally {
      setFolderBusy(null);
    }
  };

  /* ------------------------------------------------------------ the upload */

  const [dropping, setDropping] = useState(false);
  const folderUploadingRef = useRef(false);

  /*
   * One quiet upload. The picker and the drop zone both use this, so a file
   * added in a batch is not also announced on its own. `uploadEntries`
   * sends one summary after the batch.
   */
  const uploadOne = async (file: File, folder: string, title: string) => {
    const form = new FormData();
    form.set("course", course);
    form.set("folder", folder);
    form.set("title", title);
    form.set("notify", "0");
    form.set("file", file);

    const result = await uploadCourseFile({}, form);
    if (result.error) throw new Error(result.error);
    if (result.file) addUploaded(result.file);
  };

  /*
   * Add a whole tree, one file at a time.
   *
   * A directory picker gives each file a relative path such as
   * "Week 1/Slides/lecture.pdf". That path is the hierarchy: the folders are
   * made once, then each file is uploaded into the folder above it. A file
   * with no slash goes into the folder that is currently open.
   */
  const uploadEntries = async (entries: UploadEntry[]) => {
    if (entries.length === 0 || folderUploadingRef.current) return;
    folderUploadingRef.current = true;

    const startPath = path;
    setProblem(null);
    setNotice(null);

    const folders = new Set<string>();
    const rootNames = new Set<string>();

    for (const entry of entries) {
      const parts = entry.relativePath.split("/").filter(Boolean);
      if (parts.length > 1) rootNames.add(parts[0]);

      let soFar = startPath;
      for (const part of parts.slice(0, -1)) {
        soFar = soFar ? `${soFar}/${part}` : part;
        folders.add(soFar);
      }
    }

    const label =
      rootNames.size === 1
        ? [...rootNames][0]
        : rootNames.size > 1
          ? `${rootNames.size} folders`
          : startPath
            ? folderName(startPath)
            : "the course";

    setFolderUpload({ label, done: 0, total: entries.length });

    let done = 0;
    let firstError: string | null = null;

    try {
      if (folders.size > 0) {
        await createCourseFolders(course, [...folders]);
      }

      for (const entry of entries) {
        const parts = entry.relativePath.split("/").filter(Boolean);
        const base = parts[parts.length - 1] || entry.file.name;
        const folder = [
          ...startPath.split("/").filter(Boolean),
          ...parts.slice(0, -1),
        ].join("/");
        const title = base.replace(/\.[^.]+$/, "") || base;

        try {
          await uploadOne(entry.file, folder, title);
          done += 1;
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "The file could not be added.";

          /*
           * Two files in one folder can share a stem: lecture.pdf and
           * lecture.docx both become "lecture". The index keeps titles
           * unique, so try the full name before reporting a failure.
           */
          if (/already a file called/i.test(message)) {
            try {
              await uploadOne(entry.file, folder, base);
              done += 1;
            } catch (retryError) {
              firstError ??=
                retryError instanceof Error ? retryError.message : message;
            }
          } else {
            firstError ??= message;
          }
        }

        setFolderUpload({ label, done, total: entries.length });
      }
    } catch (e) {
      firstError ??=
        e instanceof Error ? e.message : "The folder could not be added.";
    } finally {
      folderUploadingRef.current = false;
      setFolderUpload(null);
    }

    if (done > 0) {
      try {
        await announceCourseFolder(course, label, done);
      } catch {
        // The files are in. A failed summary is not a failed upload.
      }
    }

    if (firstError) {
      setProblem(
        done > 0
          ? `${done} of ${entries.length} added. ${firstError}`
          : firstError
      );
    }
    if (done > 0) {
      setNotice(`${done} file${done === 1 ? "" : "s"} added to ${label}.`);
    }

    router.refresh();
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
    <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">
            Files
          </h2>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            {courseTitle}
            <span className="ml-1.5 font-mono text-[10.5px] text-muted">
              {course}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setNewFolder((n) => !n)}
            className="pressable inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            <FolderPlus size={14} className="text-accent" />
            New folder
          </button>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            aria-label="Choose a folder to upload"
            className="sr-only"
            onChange={(e) => {
              const list = Array.from(e.currentTarget.files ?? []);
              e.currentTarget.value = "";
              if (list.length === 0) return;
              void uploadEntries(
                list.map((file) => ({
                  file,
                  relativePath: relativePathOf(file),
                }))
              );
            }}
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={folderUpload !== null}
            className="pressable inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {folderUpload ? (
              <Loader2 size={14} className="animate-spin text-accent" />
            ) : (
              <FolderUp size={14} className="text-accent" />
            )}
            Upload folder
          </button>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        A file added here appears on the course page, in the search and in
        the counts within a request or two. Twenty-five megabytes is the
        limit. Drop files or a folder here, or drop a file onto a folder to
        move it. A folder keeps its own subfolders.
      </p>

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

      {folderUpload && (
        <p
          role="status"
          className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-[12.5px] text-accent"
        >
          <Loader2 size={13} className="animate-spin" />
          Adding {folderUpload.label}: {folderUpload.done} of{" "}
          {folderUpload.total}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
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
          className="pressable flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-hover lg:hidden"
        >
          <span className="truncate">
            Folder tree
            {path ? <span className="text-muted"> · {folderName(path)}</span> : null}
          </span>
          <span className="shrink-0 text-muted">{showTree ? "▾" : "▸"}</span>
        </button>

        <aside className={showTree ? "block" : "hidden lg:block"}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Folder tree
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
              aria-current={path === "" ? "page" : undefined}
              className={`pressable flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12.5px] transition-colors ${
                path === ""
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Folder size={12} className="shrink-0 text-muted" />
              The top
              <span className="tnum ml-auto text-[10.5px] text-muted">
                {folderCounts.get("") ?? 0}
              </span>
            </button>
            <Tree node={tree} depth={0} />
          </div>
          <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-muted">
            Drag a file, or a folder by its handle, onto a folder here or in
            the list. The top is a target too.
          </p>
        </aside>

        {/* The list */}
        <div className="min-w-0">
          {/* The way down */}
          <nav
            aria-label="Folder"
            className="flex flex-wrap items-center gap-1 text-[12.5px]"
          >
            {path && (
              <button
                type="button"
                onClick={() => setPath(parentPath(path))}
                aria-label="Up one folder"
                title="Up one folder"
                className="pressable inline-flex items-center gap-1 rounded border border-border px-1.5 py-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <ArrowUp size={13} />
                Up
              </button>
            )}
            <button
              type="button"
              onClick={() => setPath("")}
              title={`${courseTitle} (${course})`}
              className="pressable max-w-full rounded px-1.5 py-1 text-left font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {courseTitle}
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
              className="mt-3 flex flex-wrap items-center gap-2"
              action={(formData) => makeFolder(String(formData.get("name") ?? ""))}
            >
              <input
                name="name"
                autoFocus
                placeholder="Folder name, or Parent/Child"
                className="min-w-0 flex-1 basis-40 rounded border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus-visible:border-accent"
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
              try {
                const entries = await entriesFromDataTransfer(e.dataTransfer);
                await uploadEntries(entries);
              } catch (err) {
                setProblem(
                  err instanceof Error
                    ? err.message
                    : "The dropped items could not be read."
                );
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
                Drop files or a folder here to add them to{" "}
                <span className="text-foreground">
                  {path ? `${courseTitle} / ${path}` : courseTitle}
                </span>
                . Subfolders come with it.
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
              {foldersHere.map((folder) => {
                const folderFileCount = folderCounts.get(folder.path) ?? 0;
                const hasSubfolders = folder.children.some(
                  (child) => child.kind === "folder"
                );
                const canRemove = folderFileCount === 0 && !hasSubfolders;
                const parent = parentPath(folder.path);
                const targets = allFolderPaths(tree).filter(
                  (candidate) =>
                    candidate !== "" &&
                    candidate !== folder.path &&
                    !candidate.startsWith(`${folder.path}/`) &&
                    candidate !== parent
                );
                const busy = folderBusy === folder.path;

                return (
                  <li
                    key={folder.path}
                    data-drop-path={folder.path}
                    aria-busy={busy || undefined}
                    className={`flex flex-wrap items-center gap-2 py-2 transition-colors ${
                      over === folder.path ? "bg-accent/10" : ""
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={`Drag ${folder.name} to move it`}
                      title="Drag to move"
                      onPointerDown={(event) =>
                        beginDrag(
                          {
                            kind: "folder",
                            path: folder.path,
                            title: folder.name,
                          },
                          event
                        )
                      }
                      className="pressable shrink-0 cursor-grab touch-none rounded p-1 text-muted opacity-60 transition-opacity hover:opacity-100"
                    >
                      {busy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <GripVertical size={14} />
                      )}
                    </button>

                    {renamingFolder === folder.path ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          void renameFolderTo(
                            folder.path,
                            String(data.get("name") ?? "")
                          );
                        }}
                      >
                        <span className="w-6 shrink-0">
                          <PixelMotif
                            kind="folder"
                            title="A folder with a tab on the top left and a body with a label on it"
                            className="h-5 w-5"
                          />
                        </span>
                        <input
                          name="name"
                          autoFocus
                          defaultValue={folder.name}
                          aria-label={`New name for ${folder.name}`}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setRenamingFolder(null);
                          }}
                          className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[13px] text-foreground outline-none focus-visible:border-accent"
                        />
                        <button
                          type="submit"
                          disabled={busy}
                          className="pressable rounded p-1 text-accent transition-colors hover:bg-surface-hover disabled:opacity-50"
                          aria-label="Save the folder name"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingFolder(null)}
                          className="pressable rounded p-1 text-muted transition-colors hover:text-foreground"
                          aria-label="Cancel the folder rename"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
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
                            {folderFileCount} file
                            {folderFileCount === 1 ? "" : "s"}
                          </span>
                        </span>
                      </button>
                    )}

                    {renamingFolder !== folder.path && (
                      <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => setRenamingFolder(folder.path)}
                          disabled={busy}
                          className="pressable rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          Rename
                        </button>
                        <select
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            void moveFolderTo(
                              folder.path,
                              e.target.value === "__top" ? "" : e.target.value
                            );
                          }}
                          disabled={
                            busy || (targets.length === 0 && parent === "")
                          }
                          aria-label={`Move ${folder.name} to another folder`}
                          className="pressable max-w-[8.5rem] rounded border border-border bg-background px-1.5 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          <option value="">Move to</option>
                          {parent && <option value="__top">The top</option>}
                          {targets.map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeFolder(folder.path)}
                          disabled={!canRemove || busy}
                          title={
                            canRemove
                              ? "Remove this empty folder"
                              : "Empty this folder before removing it"
                          }
                          className="pressable rounded px-2 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}

              {filesHere.map((file) => {
                const kind: ViewerKind = kindOf(file);
                const checked = selected.has(file.id);
                return (
                  <li
                    key={file.id}
                    className={`flex flex-wrap items-center gap-2 py-2 transition-colors ${
                      checked ? "bg-accent/8" : ""
                    }`}
                    onPointerDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("input,select,button,a")) return;
                      shiftRef.current = e.shiftKey;
                      beginDrag(
                        { kind: "file", id: file.id, title: file.title },
                        e
                      );
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

                    <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:shrink-0 sm:flex-nowrap">
                      {file.source === "upload" && (
                        <>
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
                              if (e.target.value !== "") {
                                void move(file.id, e.target.value);
                              }
                            }}
                            className="pressable max-w-[9rem] rounded border border-border bg-background px-1.5 py-1 text-[11.5px] text-muted transition-colors hover:text-foreground"
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
                        </>
                      )}

                      <a
                        href={resourceUrl(file.url)}
                        download
                        className="pressable shrink-0 rounded p-1.5 text-muted transition-colors hover:text-foreground"
                        aria-label={`Download ${file.title}`}
                      >
                        <Download size={14} />
                      </a>
                    </div>
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
          {drag.kind === "folder" ? (
            <Folder size={14} className="text-accent" />
          ) : (
            <FileArchive size={14} className="text-accent" />
          )}
          <span className="max-w-[16rem] truncate">{drag.title}</span>
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

/** Keep the open folder in view after a folder is moved or renamed. */
function relocatePath(current: string, from: string, to: string): string {
  if (current === from) return to;
  if (current.startsWith(`${from}/`)) {
    return `${to}${current.slice(from.length)}`;
  }
  return current;
}

/** The path the file had in the folder picker, not just its name. */
function relativePathOf(file: File): string {
  return (file.webkitRelativePath || file.name).replace(/\\/g, "/");
}

/*
 * Turn a dropped entry into files with their device paths.
 *
 * A dropped folder is not a FileList: the browser gives a directory entry
 * that has to be walked. The walk keeps the folder name as the first part of
 * every path, so "Week 1/Slides/lecture.pdf" becomes the same shape as a
 * folder chosen through the directory picker.
 */
async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: UploadEntry[]
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    out.push({
      file,
      relativePath: prefix ? `${prefix}/${entry.name}` : entry.name,
    });
    return;
  }

  if (!entry.isDirectory) return;

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;

  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    for (const child of batch) {
      await walkEntry(child, nextPrefix, out);
    }
  }
}

async function entriesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<UploadEntry[]> {
  const roots: FileSystemEntry[] = [];

  // This has to happen before any await: the browser only lends the entries
  // for the duration of the drop event.
  for (const item of Array.from(dataTransfer.items ?? [])) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) roots.push(entry);
  }

  if (roots.length === 0) {
    return Array.from(dataTransfer.files).map((file) => ({
      file,
      relativePath: relativePathOf(file),
    }));
  }

  const out: UploadEntry[] = [];
  for (const entry of roots) await walkEntry(entry, "", out);
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
