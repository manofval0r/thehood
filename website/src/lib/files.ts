import "server-only";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { rest, storage, storeConfig } from "@/lib/rest";
import { COURSES } from "@/lib/resources";
import { ARCHIVE } from "@/lib/archive";

/**
 * The file index and the upload path.
 *
 * Two kinds of file, one index:
 *
 *   - An archive file lives in the repository and is served from the site's
 *     own public folder. It is in the index so the course page, the search
 *     and the counts all agree about what exists.
 *   - An uploaded file lives in Supabase Storage and was added by staff
 *     through the staff area. It can be removed from here.
 *
 * The index is cached and tagged. An upload calls revalidateTag("files"), so
 * the course page, the search and the counts all pick the change up on the
 * next request instead of waiting for the cache to age out.
 */

export type FileType = "pdf" | "pptx" | "xlsx" | "doc" | "other";

export interface CourseFile {
  id: string;
  /** The course code the file belongs to. */
  course: string;
  title: string;
  type: FileType;
  url: string;
  size: number | null;
  source: "archive" | "upload";
  /** The key in the storage bucket. Null for an archive file. */
  storage_path?: string | null;
  uploaded_at?: string;
  /**
   * The folder inside the course.
   *
   * Null for an archive file, which takes the folder its address implies.
   * Staff set it when they move something, or when they upload into a
   * folder.
   */
  folder?: string | null;
}

const BUCKET = "course-files";

/** Supabase's free tier allows far more than this per object. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function base(): { url: string; key: string } {
  const config = storeConfig();
  if (!config) {
    throw new Error(
      "The file store is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }
  return config;
}

export function isConfigured(): boolean {
  return storeConfig() !== null;
}

/* --------------------------------------------------------------- reading */

async function readIndex(): Promise<CourseFile[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  const rows = await rest<CourseFile[]>(
    "files?select=*&order=uploaded_at.desc"
  );
  return rows ?? [];
}

/**
 * The archive, from the scan.
 *
 * The files in the repository are the archive. They are also in the index,
 * but the index is a database and a database can be missing, empty or
 * unmigrated, and a course page that shows nothing because a table was not
 * populated is a worse failure than a duplicated row.
 *
 * So the scan is merged in behind the index: anything the index already
 * knows about wins, anything it does not is filled in from the scan. Once
 * the migration has run the merge adds nothing.
 *
 * The scan is a list of what is in the folder, written when the site was
 * built. It knows every file, including the ones the hand-written manifest
 * never listed, and it knows which folder each one is in.
 */
function archiveFiles(): Record<string, CourseFile[]> {
  const out: Record<string, CourseFile[]> = {};
  for (const course of COURSES) out[course.code] = [];

  for (const entry of ARCHIVE) {
    if (!out[entry.course]) out[entry.course] = [];
    out[entry.course].push({
      id: entry.id,
      course: entry.course,
      title: entry.title,
      type: typeForName(entry.url),
      url: entry.url,
      size: entry.size || null,
      folder: entry.folder,
      source: "archive",
    });
  }
  return out;
}

/** A file size as a human would read it, for the card. */
export function fileSize(bytes: number | null): string | undefined {
  if (!bytes) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Puts the index and the archive together.
 *
 * The archive is the truth about the files in the repository: what they
 * are called, how big they are, which folder they are in. It is written
 * when the site is built, from what is actually in the folder.
 *
 * The index is the truth about the files staff added, and about where a
 * member of staff has moved an archive file to. So an archive file keeps
 * its title from the scan and takes its folder from the index when the
 * index has one, because moving a file is a thing a person does and
 * naming one is a thing the repository decides.
 */
function mergeArchive(rows: CourseFile[]): CourseFile[] {
  const index = new Map(rows.map((r) => [r.id, r]));

  // The files staff uploaded are theirs alone.
  const out: CourseFile[] = rows.filter((r) => r.source === "upload");

  for (const file of Object.values(archiveFiles()).flat()) {
    const override = index.get(file.id);
    out.push(
      override
        ? { ...file, folder: override.folder ?? file.folder }
        : file
    );
  }
  return out;
}

/**
 * The files for one course.
 *
 * The index is cached and tagged, so the course pages stay prerendered and
 * an upload still reaches them within a request. The archive is merged in
 * outside the cache, because the archive is part of the code rather than
 * part of the database, and a cached copy of it would go on serving the
 * list the site had when it was last built.
 */
export async function getCourseFiles(courseCode: string): Promise<CourseFile[]> {
  if (!isConfigured()) return archiveFiles()[courseCode] ?? [];

  try {
    const merged = mergeArchive(await readIndex());
    return merged.filter((r) => r.course === courseCode);
  } catch {
    return archiveFiles()[courseCode] ?? [];
  }
}

/** The whole index, for the search and the counts. */
export async function getAllFiles(): Promise<CourseFile[]> {
  if (!isConfigured()) return Object.values(archiveFiles()).flat();

  try {
    return mergeArchive(await readIndex());
  } catch {
    return Object.values(archiveFiles()).flat();
  }
}

/** The index grouped by course code. */
export async function getFilesByCourse(): Promise<Record<string, CourseFile[]>> {
  const out: Record<string, CourseFile[]> = {};
  for (const course of COURSES) out[course.code] = [];

  for (const file of await getAllFiles()) {
    if (!out[file.course]) out[file.course] = [];
    out[file.course].push(file);
  }
  return out;
}

/**
 * One file, by its id.
 *
 * The viewer is addressed by the file's id rather than by its address, so
 * that a link to a file keeps working when the file is renamed, and so that
 * the id is the only thing in the address that can be guessed.
 *
 * Not cached, and that is deliberate. The archive is part of the code rather
 * than part of the database, and a cached copy of it would go on serving the
 * list the site had when it was last built. The index read inside it is
 * cached, so this costs the same as the index does.
 */
export async function getFileById(id: string): Promise<CourseFile | null> {
  if (!id) return null;
  const all = await getAllFiles();
  return all.find((f) => f.id === id) ?? null;
}

/* -------------------------------------------------------------- writing */

/** The file type, from the extension. */
export function typeForName(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "pptx" || ext === "ppt") return "pptx";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "xlsx";
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) return "doc";
  return "other";
}

/** A file name that is safe to put in a URL and in a bucket key. */
export function safeName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w.\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 120) || "file"
  );
}

function slugFor(code: string): string {
  const course = COURSES.find((c) => c.code === code);
  return course ? course.slug : safeName(code).toLowerCase();
}

/** The public URL of an object in the bucket. */
export function publicUrl(path: string): string {
  const { url } = base();
  return `${url}/storage/v1/object/public/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/**
 * Store a file and index it.
 *
 * The upload goes to the bucket first and the index row second. If the
 * second step fails, an object sits in the bucket that nothing points at,
 * which is untidy but harmless. The other order would leave an index row
 * pointing at a file that was never stored, which is a broken link on a
 * student's course page.
 */
export async function uploadFile(args: {
  course: string;
  title: string;
  file: File;
  uploadedBy: string;
  /** The folder inside the course. Empty for the top of it. */
  folder?: string;
}): Promise<CourseFile> {
  if (args.file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `That file is ${(args.file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`
    );
  }

  const path = `${slugFor(args.course)}/${Date.now()}-${safeName(args.file.name)}`;
  const bytes = await args.file.arrayBuffer();

  const res = await storage(`object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": args.file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: bytes,
  });

  if (!res.ok) {
    throw new Error(`The upload was refused: ${res.status} ${await res.text()}`);
  }

  const folder = args.folder?.trim() || null;

  const row = {
    id: `up_${crypto.randomUUID().slice(0, 8)}_${Date.now().toString(36)}`,
    course: args.course,
    title: args.title,
    type: typeForName(args.file.name),
    url: publicUrl(path),
    size: args.file.size,
    source: "upload",
    storage_path: path,
    uploaded_by: args.uploadedBy,
    folder,
  };

  const created = await rest<CourseFile[]>("files", {
    method: "POST",
    body: row,
    prefer: "return=representation",
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("23505") || message.includes("duplicate key")) {
      throw new Error(
        `There is already a file called "${args.title}"${
          folder ? ` in ${folder}` : ""
        } on ${args.course}. Give it a different name, or remove the one that is there.`
      );
    }
    throw error;
  });

  return created[0] as CourseFile;
}

/**
 * Remove an uploaded file.
 *
 * Only uploads can be removed. An archive file lives in the repository, and
 * taking it out of the index would leave the file itself sitting in the
 * public folder with nothing pointing at it.
 */
export async function deleteFile(id: string): Promise<void> {
  const rows = await rest<(CourseFile & { storage_path: string | null })[]>(
    `files?id=eq.${encodeURIComponent(id)}&select=*`
  );

  const row = rows?.[0];
  if (!row) return;

  if (row.source !== "upload" || !row.storage_path) {
    throw new Error(
      "That file lives in the repository and cannot be removed from here."
    );
  }

  const del = await storage(
    `object/${BUCKET}/${row.storage_path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { method: "DELETE" }
  );
  if (!del.ok && del.status !== 404) {
    throw new Error(`The file could not be removed: ${del.status}`);
  }

  await rest(`files?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Change what a file is called.
 *
 * Only the title changes. The name of the file itself does not, because
 * changing it would break the link, and the row in the index is the link.
 */
export async function renameFile(id: string, title: string): Promise<void> {
  await rest(`files?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title },
  });
}

/** Makes sure the bucket exists. Safe to run again. */
export async function ensureBucket(): Promise<void> {
  const head = await storage(`bucket/${BUCKET}`);
  if (head.ok) return;

  const create = await storage("bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_UPLOAD_BYTES,
    }),
  });
  if (!create.ok) {
    throw new Error(`The bucket could not be created: ${await create.text()}`);
  }
}

/* -------------------------------------------------------------- folders */

/**
 * The folders staff made in a course.
 *
 * These are the folders that exist on their own. The folders that files
 * imply are worked out from the files themselves, and the two are put
 * together by the tree.
 */
export async function getCourseFolders(course: string): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  if (!isConfigured()) return [];

  try {
    const rows = await rest<{ path: string }[]>(
      `course_folders?course=eq.${encodeURIComponent(course)}&select=path`
    );
    return (rows ?? []).map((r) => r.path);
  } catch {
    return [];
  }
}

/**
 * The folders staff made, by course.
 *
 * These are the folders that exist on their own. The folders that files
 * imply are worked out from the files themselves, and the two are put
 * together by the tree.
 */
export async function getFoldersByCourse(): Promise<Record<string, string[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  const out: Record<string, string[]> = {};
  if (!isConfigured()) return out;

  try {
    const rows = await rest<{ course: string; path: string }[]>(
      "course_folders?select=course,path"
    );
    for (const row of rows ?? []) {
      if (!out[row.course]) out[row.course] = [];
      out[row.course].push(row.path);
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Put a file in a folder.
 *
 * The file does not move on disk and the object does not move in the
 * bucket. The index says where it is, and that is what a student is shown
 * and what a zip is built from. So a move is one column and it is instant.
 */
export async function moveFileToFolder(
  id: string,
  folder: string
): Promise<void> {
  await rest(`files?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { folder: folder.trim() || null },
  });
  updateTag("files");
}

/** Make a folder in a course. */
export async function createFolder(course: string, path: string): Promise<void> {
  const clean = path.trim();
  if (!clean) throw new Error("A folder needs a name.");

  await rest("course_folders", {
    method: "POST",
    body: {
      id: `fd_${crypto.randomUUID().slice(0, 8)}_${Date.now().toString(36)}`,
      course,
      path: clean,
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  updateTag("files");
}

/**
 * Rename a folder.
 *
 * Everything inside it moves with it, so a student looking for the manual
 * finds it under the new name and not under the old one.
 */
export async function renameFolder(
  course: string,
  from: string,
  to: string
): Promise<void> {
  const target = to.trim();
  if (!target) throw new Error("A folder needs a name.");
  if (from === target) return;

  // The files inside the folder, and inside anything under it.
  const files = await rest<(CourseFile & { folder: string | null })[]>(
    `files?course=eq.${encodeURIComponent(course)}&select=id,folder`
  );
  const inside = (files ?? []).filter(
    (f) => typeof f.folder === "string" && f.folder.startsWith(from)
  );

  for (const file of inside) {
    const folder = (file.folder as string).replace(from, target);
    await rest(`files?id=eq.${encodeURIComponent(file.id)}`, {
      method: "PATCH",
      body: { folder },
    });
  }

  // The folders under it, including itself.
  const folders = await rest<{ id: string; path: string }[]>(
    `course_folders?course=eq.${encodeURIComponent(course)}&select=id,path`
  );
  for (const folder of folders ?? []) {
    if (!folder.path.startsWith(from)) continue;
    await rest(`course_folders?id=eq.${encodeURIComponent(folder.id)}`, {
      method: "PATCH",
      body: { path: folder.path.replace(from, target) },
    });
  }

  updateTag("files");
}

/**
 * Remove a folder.
 *
 * Only an empty one. A folder with something in it is not removed and its
 * contents are not thrown away, because the person pressing the button
 * wanted the folder gone and not the material.
 */
export async function deleteFolder(course: string, path: string): Promise<void> {
  const files = await rest<{ id: string; folder: string | null }[]>(
    `files?course=eq.${encodeURIComponent(course)}&select=id,folder`
  );
  const occupied = (files ?? []).some(
    (f) => typeof f.folder === "string" && f.folder.startsWith(path)
  );
  if (occupied) {
    throw new Error(
      "That folder still has files in it. Move them out first, or remove them."
    );
  }

  const folders = await rest<{ id: string; path: string }[]>(
    `course_folders?course=eq.${encodeURIComponent(course)}&select=id,path`
  );
  const under = (folders ?? []).filter((f) => f.path.startsWith(path));
  if (under.length > 1) {
    throw new Error("That folder has folders inside it. Empty them first.");
  }

  await rest(`course_folders?course=eq.${encodeURIComponent(course)}&path=eq.${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
  updateTag("files");
}
