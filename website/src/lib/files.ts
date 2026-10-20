import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { COURSES } from "@/lib/resources";

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
}

const BUCKET = "course-files";

/** Supabase's free tier allows far more than this per object. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function base(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "The file store is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }
  return { url, key };
}

export function isConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/* --------------------------------------------------------------- reading */

async function readIndex(): Promise<CourseFile[]> {
  const { url, key } = base();
  const res = await fetch(`${url}/rest/v1/files?select=*&order=uploaded_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`The file index returned ${res.status}`);
  }
  const rows = await res.json();
  return (rows ?? []) as CourseFile[];
}

/**
 * The archive, from the manifest.
 *
 * The files in the repository are the archive. They are also in the index,
 * but the index is a database and a database can be missing, empty or
 * unmigrated, and a course page that shows nothing because a table was not
 * populated is a worse failure than a duplicated row.
 *
 * So the manifest is merged in behind the index: anything the index already
 * knows about wins, anything it does not is filled in from the manifest.
 * Once the migration has run the merge adds nothing.
 */
function archiveFiles(): Record<string, CourseFile[]> {
  const out: Record<string, CourseFile[]> = {};
  for (const course of COURSES) {
    out[course.code] = course.resources.map((r) => ({
      id: r.id,
      course: course.code,
      title: r.title,
      type: r.type,
      url: r.url,
      // The manifest's size is a display string, and the index keeps the
      // real number of bytes. The archive copy in memory has neither, which
      // is only used when the database cannot be reached.
      size: null,
      source: "archive" as const,
    }));
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

/** The index, with the archive filled in behind it. */
function mergeArchive(rows: CourseFile[]): CourseFile[] {
  const known = new Set(rows.map((r) => r.id));
  const out = [...rows];
  for (const files of Object.values(archiveFiles())) {
    for (const file of files) {
      if (!known.has(file.id)) out.push(file);
    }
  }
  return out;
}

/**
 * The files for one course.
 *
 * Cached and tagged, so the course pages stay prerendered and an upload
 * still reaches them within a request.
 */
export async function getCourseFiles(courseCode: string): Promise<CourseFile[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  if (!isConfigured()) return archiveFiles()[courseCode] ?? [];

  try {
    const rows = await readIndex();
    const merged = mergeArchive(rows);
    return merged.filter((r) => r.course === courseCode);
  } catch {
    return archiveFiles()[courseCode] ?? [];
  }
}

/** The whole index, for the search and the counts. */
export async function getAllFiles(): Promise<CourseFile[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  if (!isConfigured()) return Object.values(archiveFiles()).flat();

  try {
    return mergeArchive(await readIndex());
  } catch {
    return Object.values(archiveFiles()).flat();
  }
}

/** The index grouped by course code. */
export async function getFilesByCourse(): Promise<Record<string, CourseFile[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("files");

  const out: Record<string, CourseFile[]> = {};
  for (const course of COURSES) out[course.code] = [];

  for (const file of await getAllFiles()) {
    if (!out[file.course]) out[file.course] = [];
    out[file.course].push(file);
  }
  return out;
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
}): Promise<CourseFile> {
  const { url, key } = base();

  if (args.file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `That file is ${(args.file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`
    );
  }

  const path = `${slugFor(args.course)}/${Date.now()}-${safeName(args.file.name)}`;
  const bytes = await args.file.arrayBuffer();

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": args.file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: bytes,
  });

  if (!res.ok) {
    throw new Error(`The upload was refused: ${res.status} ${await res.text()}`);
  }

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
  };

  const insert = await fetch(`${url}/rest/v1/files`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!insert.ok) {
    throw new Error(
      `The file was stored but could not be indexed: ${await insert.text()}`
    );
  }

  const created = await insert.json();
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
  const { url, key } = base();

  const res = await fetch(
    `${url}/rest/v1/files?id=eq.${encodeURIComponent(id)}&select=*`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) throw new Error(`The file index returned ${res.status}`);

  const rows = await res.json();
  const row = rows?.[0] as CourseFile | undefined;
  if (!row) return;

  if (row.source !== "upload" || !row.storage_path) {
    throw new Error(
      "That file lives in the repository and cannot be removed from here."
    );
  }

  const del = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${row.storage_path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!del.ok && del.status !== 404) {
    throw new Error(`The file could not be removed: ${del.status}`);
  }

  const drop = await fetch(
    `${url}/rest/v1/files?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!drop.ok) throw new Error(`The index row could not be removed: ${drop.status}`);
}

/** Makes sure the bucket exists. Safe to run again. */
export async function ensureBucket(): Promise<void> {
  const { url, key } = base();
  const res = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.ok) return;

  const create = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
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
