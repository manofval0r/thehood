/**
 * What kind of thing a file is, and what can be done with it.
 *
 * The index keeps a coarse type, which is enough for an icon: pdf, pptx,
 * xlsx, doc, other. A viewer needs to know more than that. A .txt and a
 * .eml are both "doc" to the index and are nothing alike to a reader.
 *
 * So the finer kind is worked out from the file's own address rather than
 * from a column. The address ends in the real file name for both kinds of
 * file: an archive file sits at /courses/<course>/<name> and an uploaded
 * file sits at /storage/v1/object/public/course-files/<course>/<name>. The
 * column is the fallback for anything whose address says nothing useful.
 */

export type ViewerKind =
  | "pdf"
  | "slides"
  | "sheet"
  | "word"
  | "text"
  | "json"
  | "csv"
  | "email"
  | "image"
  | "archive"
  | "unknown";

/** The file kinds a viewer exists for. */
export const VIEWABLE: readonly ViewerKind[] = [
  "pdf",
  "slides",
  "sheet",
  "word",
  "text",
  "json",
  "csv",
  "email",
  "image",
];

const EXTENSION_KIND: Record<string, ViewerKind> = {
  pdf: "pdf",
  pptx: "slides",
  ppt: "slides",
  odp: "slides",
  key: "slides",
  xlsx: "sheet",
  xls: "sheet",
  ods: "sheet",
  csv: "csv",
  tsv: "csv",
  docx: "word",
  doc: "word",
  odt: "word",
  rtf: "word",
  json: "json",
  jsonl: "json",
  ndjson: "json",
  txt: "text",
  md: "text",
  markdown: "text",
  log: "text",
  sh: "text",
  py: "text",
  js: "text",
  ts: "text",
  css: "text",
  html: "text",
  htm: "text",
  xml: "text",
  yml: "text",
  yaml: "text",
  toml: "text",
  ini: "text",
  cfg: "text",
  conf: "text",
  sql: "text",
  c: "text",
  h: "text",
  cpp: "text",
  java: "text",
  rs: "text",
  go: "text",
  rb: "text",
  php: "text",
  eml: "email",
  msg: "email",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  avif: "image",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  "7z": "archive",
  rar: "archive",
};

/** The label for each kind, for the word on the tab. */
export const KIND_LABEL: Record<ViewerKind, string> = {
  pdf: "Document",
  slides: "Slides",
  sheet: "Spreadsheet",
  word: "Document",
  text: "Text",
  json: "JSON",
  csv: "Table",
  email: "Message",
  image: "Image",
  archive: "Archive",
  unknown: "File",
};

/** The short label, for the badge on a card. */
export const KIND_SHORT: Record<ViewerKind, string> = {
  pdf: "PDF",
  slides: "PPT",
  sheet: "XLS",
  word: "DOC",
  text: "TXT",
  json: "JSON",
  csv: "CSV",
  email: "MAIL",
  image: "IMG",
  archive: "ZIP",
  unknown: "FILE",
};

/** The colour of each kind, matching the pixel motif that draws it. */
export const KIND_COLOUR: Record<ViewerKind, string> = {
  pdf: "#f87171",
  slides: "#fb923c",
  sheet: "#4ade80",
  word: "#60a5fa",
  text: "#94a3b8",
  json: "#22c55e",
  csv: "#38bdf8",
  email: "#c084fc",
  image: "#f472b6",
  archive: "#64748b",
  unknown: "#a3a3a3",
};

/** The extension of a name or an address, in lower case and without the dot. */
export function extensionOf(nameOrUrl: string): string {
  const withoutQuery = nameOrUrl.split(/[?#]/)[0];
  const last = withoutQuery.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  if (dot <= 0) return "";
  return last.slice(dot + 1).toLowerCase();
}

/** The kind of a file, from its address, with the index's type as a fallback. */
export function kindOf(file: {
  url: string;
  title?: string;
  type?: string;
}): ViewerKind {
  const byExtension =
    EXTENSION_KIND[extensionOf(file.url)] ??
    EXTENSION_KIND[extensionOf(file.title ?? "")];
  if (byExtension) return byExtension;

  // Nothing in the name. The coarse type is all there is.
  switch (file.type) {
    case "pdf":
      return "pdf";
    case "pptx":
      return "slides";
    case "xlsx":
      return "sheet";
    case "doc":
      return "text";
    default:
      return "unknown";
  }
}

/** True when there is something to show rather than only something to download. */
export function canView(kind: ViewerKind): boolean {
  return VIEWABLE.includes(kind);
}

/**
 * The pixel motif for a kind.
 *
 * The site draws its pictures rather than using an icon set, so every kind
 * of file needs a shape that can be named from across the room. The motifs
 * are generated into PixelMotif.tsx by tools/pixel-motifs.js.
 */
export function motifFor(kind: ViewerKind): string {
  switch (kind) {
    case "pdf":
    case "word":
      return "journal";
    case "slides":
      return "slides";
    case "sheet":
      return "sheet";
    case "csv":
      return "table";
    case "text":
      return "notebook";
    case "json":
      return "code";
    case "email":
      return "mail";
    case "image":
      return "image";
    case "archive":
      return "box";
    default:
      return "tool";
  }
}

/** What the motif depicts, for anyone who cannot see it. */
export const MOTIF_TITLE: Record<ViewerKind, string> = {
  pdf: "A page with a folded corner and ruled lines",
  slides: "A screen on a stand with a chart on it",
  sheet: "A spreadsheet with one cell picked out",
  word: "A page with a folded corner and ruled lines",
  text: "A page with a marked margin",
  json: "A pair of braces with a colon between them",
  csv: "A grid of cells with a ruled header",
  email: "An envelope with its flap folded down",
  image: "A framed picture with a sun and a hill in it",
  archive: "A closed box with a lid and a seal",
  unknown: "A spanner head and handle",
};

/**
 * The media type to ask for.
 *
 * The browser sniffs what it is given, so this is mostly about being honest
 * with a fetch. A file served as text/plain that is really JSON is still
 * parsed as JSON by the viewer, because the viewer reads the text.
 */
export function mediaTypeFor(kind: ViewerKind, url: string): string {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "slides":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "sheet":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "word":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "email":
      return "message/rfc822";
    case "image":
      return extensionOf(url) === "svg" ? "image/svg+xml" : "image/*";
    default:
      return "text/plain";
  }
}

/**
 * The folder a file sits in.
 *
 * The address of an archive file carries its folder: a file under
 * "CYB305 Lab Evidence Manual/docs" is in that folder, because that is
 * where it lives in the repository. The first segment is the course, which
 * is the course the file belongs to and not a folder inside it.
 */
export function folderFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0];
  const parts = path.split("/").filter(Boolean);

  // /courses/<course>/<folder...>/<file> or
  // /storage/v1/object/public/course-files/<course>/<folder...>/<file>
  let courseAt = parts.indexOf("course-files");
  if (courseAt === -1) courseAt = parts.indexOf("courses");
  if (courseAt === -1) return "";

  const rest = parts.slice(courseAt + 2); // past "courses" and the course name
  rest.pop(); // the file name
  return rest.join("/");
}
