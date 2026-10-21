/**
 * The shape of a course's files.
 *
 * A course's material is a tree. Some of it is a flat list, which is the
 * common case and needs no tree at all. Some of it has folders, because a
 * lab manual has a folder of source evidence and a folder of working
 * copies, and because a lecturer wants "Assessment 1" to exist before
 * anything is put in it.
 *
 * The folder of a file is in the index. A file with nothing in the index
 * takes the folder its address implies, which is how the files in the
 * repository keep the folders they already have on disk.
 *
 * This file is shared between the server and the browser, so it holds no
 * secrets and reaches for nothing.
 */

export interface FileNode {
  id: string;
  title: string;
  type: string;
  url: string;
  size?: number | string | null;
  /** The folder inside the course. Empty for a file at the top. */
  folder: string | null;
  source?: string;
}

export interface FolderNode {
  kind: "folder";
  name: string;
  /** The path inside the course. Empty is the top of the course. */
  path: string;
  children: TreeNode[];
}

export interface LeafNode {
  kind: "file";
  file: FileNode;
}

export type TreeNode = FolderNode | LeafNode;

/**
 * The folder a file is in.
 *
 * The index knows it. When it does not, the address does: a file at
 * /courses/<course>/<folder>/<name> is in <folder>.
 */
export function folderOf(file: {
  folder?: string | null;
  url: string;
}): string {
  if (typeof file.folder === "string") return file.folder;
  return folderFromUrl(file.url);
}

/**
 * The folder an address implies.
 *
 * The first segment after the course is the course's own folder on disk,
 * and the course belongs to the course rather than to a folder inside it.
 */
export function folderFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0];
  const parts = path.split("/").filter(Boolean);

  let at = parts.indexOf("course-files");
  if (at === -1) at = parts.indexOf("courses");
  if (at === -1) return "";

  const rest = parts.slice(at + 2); // past "courses" and the course folder
  rest.pop(); // the file name
  return rest.join("/");
}

/** The name of a folder, which is the last segment of its path. */
export function folderName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

/** The folder a path sits inside. */
export function parentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

/** Every folder on the way to a path, and the path itself. */
export function pathChain(path: string): string[] {
  const parts = path.split("/").filter(Boolean);
  const chain: string[] = [""];
  let soFar = "";
  for (const part of parts) {
    soFar = soFar ? `${soFar}/${part}` : part;
    chain.push(soFar);
  }
  return chain;
}

/**
 * The tree of a course.
 *
 * The folders come from two places and are put together here: the ones
 * the index implies from the files, and the ones staff made on their own,
 * which may have nothing in them yet.
 */
export function buildTree(
  files: FileNode[],
  declaredFolders: string[] = []
): FolderNode {
  const root: FolderNode = { kind: "folder", name: "", path: "", children: [] };

  const folders = new Map<string, FolderNode>();
  folders.set("", root);

  const ensure = (path: string): FolderNode => {
    const existing = folders.get(path);
    if (existing) return existing;

    const parent = ensure(parentPath(path));
    const node: FolderNode = {
      kind: "folder",
      name: folderName(path),
      path,
      children: [],
    };
    parent.children.push(node);
    folders.set(path, node);
    return node;
  };

  // The folders staff made, so an empty one still shows.
  for (const path of declaredFolders) ensure(path);

  for (const file of files) {
    const path = folderOf(file);
    const parent = ensure(path);
    parent.children.push({ kind: "file", file: { ...file, folder: path } });
  }

  // Folders first, then files, and each group by name.
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      const an = a.kind === "folder" ? a.name : a.file.title;
      const bn = b.kind === "folder" ? b.name : b.file.title;
      return an.localeCompare(bn, undefined, { numeric: true });
    });
    for (const node of nodes) {
      if (node.kind === "folder") sort(node.children);
    }
  };
  sort(root.children);

  return root;
}

/** The children of one folder in a tree. */
export function contentsAt(tree: FolderNode, path: string): TreeNode[] {
  let node = tree;
  for (const part of path.split("/").filter(Boolean)) {
    const next = node.children.find(
      (c): c is FolderNode => c.kind === "folder" && c.name === part
    );
    if (!next) return [];
    node = next;
  }
  return node.children;
}

/** Every folder in a tree, with the paths. */
export function allFolders(tree: FolderNode): FolderNode[] {
  const out: FolderNode[] = [];
  const walk = (node: FolderNode) => {
    for (const child of node.children) {
      if (child.kind !== "folder") continue;
      out.push(child);
      walk(child);
    }
  };
  walk(tree);
  return out;
}

/** How many files are under a folder, at any depth. */
export function countFiles(node: FolderNode): number {
  let n = 0;
  for (const child of node.children) {
    n += child.kind === "folder" ? countFiles(child) : 1;
  }
  return n;
}

/**
 * A folder path that is safe to put in a key and in a bucket.
 *
 * The path is what a lecturer types, so it keeps its spaces and its
 * punctuation. Only the characters that would break a URL or a key are
 * changed.
 */
export function cleanPath(path: string): string {
  return path
    .split("/")
    .map((part) => part.trim().replace(/[\\?%*:|"<>]/g, "-"))
    .filter(Boolean)
    .join("/");
}
