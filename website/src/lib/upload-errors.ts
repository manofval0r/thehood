/**
 * Upload failure translation.
 *
 * Uploads ride Server Actions, so a failure can happen at three layers: the
 * transport (connection drop, deployment swap, request body rejected by the
 * framework), the framework (body size limit), or the app's own checks. The
 * transport and framework layers produce raw or generic text — Next.js
 * contributes "An unexpected response was received from the server." — which
 * tells a reader nothing about what to do. This maps the known raw texts to
 * plain sentences that name the cause and the fix.
 */

/** The app-level per-file limit, in bytes. Mirrors MAX_UPLOAD_BYTES in lib/files. */
export const MAX_UPLOAD_MB = 25;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export function friendlyUploadError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");

  // Next.js client router, when a Server Action's HTTP response is not an
  // RSC payload. Almost always the body limit or a dropped connection.
  if (/unexpected response was received from the server/i.test(raw)) {
    return `The server could not complete that upload. It usually means the file was too large for one request or the connection dropped. Keep files under ${MAX_UPLOAD_MB} MB and try again.`;
  }
  // The framework body limit, or the storage proxy refusing the payload.
  if (/body size limit|bodySizeLimit|payload too large|\b413\b/i.test(raw)) {
    return `That file is too large for one request. Keep files under ${MAX_UPLOAD_MB} MB, or split it into parts.`;
  }
  if (/failed to fetch|networkerror|load failed|connection (dropped|lost|refused)/i.test(raw)) {
    return "The connection dropped before the upload finished. Check your network and try again.";
  }
  return raw || "The file could not be added. Check your connection and try again.";
}

/**
 * A human line for a file that can be rejected before any request is made:
 * empty selections and files past the app limit. Returns null when the file
 * is fine, so callers can just continue.
 */
export function preflightUploadFile(file: File): string | null {
  if (file.size === 0) {
    return `"${file.name}" is empty (0 bytes), so there is nothing to upload.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB per file — split it or compress it first.`;
  }
  return null;
}
