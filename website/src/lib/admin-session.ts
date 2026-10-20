import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStaff, type StaffMember } from "@/lib/staff";

/**
 * The staff session.
 *
 * A signed cookie rather than the code itself: the browser never holds a
 * code, only a value it cannot forge. The signature is checked with a
 * constant-time comparison, and the payload carries the id of the person who
 * signed in, so every mark they make carries their name rather than the
 * word "staff".
 *
 * The signing key is a separate thing from anybody's code. Rotating it ends
 * every session at once, which is what you want when you suspect it has
 * leaked. It is not a way in.
 */

const COOKIE = "thehood_admin";
/** How long one sitting lasts. */
const TTL_SECONDS = 60 * 60 * 12;

function signingKey(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value) {
    throw new Error(
      "ADMIN_SECRET is not set, so the staff area cannot be opened."
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** Open a session for one person. Only ever called from a Server Action. */
export async function startSession(staffId: string): Promise<void> {
  const expires = Date.now() + TTL_SECONDS * 1000;
  const payload = `${expires}.${staffId}`;
  const value = `${payload}.${sign(payload)}`;

  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/** Close the session. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * Who is signed in, if anyone.
 *
 * The id in the cookie is only a claim. The person is looked up and checked
 * to still be on the list, so removing someone from the list ends their
 * access immediately rather than whenever their cookie happens to expire.
 */
export async function currentStaff(): Promise<StaffMember | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const dot = payload.indexOf(".");
  if (dot < 1) return null;

  const expires = Number(payload.slice(0, dot));
  const staffId = payload.slice(dot + 1);
  if (!Number.isFinite(expires) || Date.now() >= expires) return null;

  try {
    const member = await getStaff(staffId);
    if (!member || !member.active) return null;
    const { secret_hash: _ignored, ...safe } = member;
    return safe;
  } catch {
    return null;
  }
}

/**
 * A login throttle.
 *
 * Five wrong guesses from one address locks that address out for a quarter
 * of an hour. The counters live in this instance's memory, so on a
 * serverless deployment the lockout is per instance rather than global,
 * which is weaker than a shared store and worth knowing about. It exists to
 * make guessing slow, not to make it impossible.
 */
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; until: number }>();

export function loginBlocked(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now > entry.until) {
    failures.set(key, { count: 1, until: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
  entry.until = now + WINDOW_MS;
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
