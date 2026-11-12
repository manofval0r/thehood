/**
 * Which assignments this browser created, kept in localStorage.
 *
 * Assignment creation is fully public, so ownership cannot live in a
 * roster. The server instead hands the creator a deterministic token at
 * creation time (an HMAC of the assignment id); this file is where the
 * browser keeps it. No sign-in, no account, same pattern as the old
 * assessments page's anonymous student id.
 */

const KEY = "cybersec:assignment-owners";

type OwnerMap = Record<string, string>;

function read(): OwnerMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as OwnerMap;
  } catch {
    return {};
  }
}

export function ownedTokenFor(assignmentId: string): string | null {
  if (typeof window === "undefined") return null;
  return read()[assignmentId] ?? null;
}

/** Every assignment id this browser can manage. */
export function ownedAssignmentIds(): string[] {
  return Object.keys(read());
}

export function recordOwnerToken(assignmentId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = read();
    map[assignmentId] = token;
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // A full localStorage just means the owner cannot edit later; tolerable.
  }
}

export function forgetOwnerToken(assignmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = read();
    delete map[assignmentId];
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Nothing to do; the token lingering is harmless.
  }
}
