import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The admin session.
 *
 * One shared secret, no accounts. Whoever knows the code is staff for as long
 * as the code is not rotated, which is the honest description of how a
 * departmental CMS works with one shared credential, and the reason the
 * secret has to be rotatable in one place and never written down anywhere
 * the site can reach it.
 *
 * The session is a signed cookie rather than the secret itself: the browser
 * never holds the secret, only a value it cannot forge. The signature is
 * checked with a constant-time comparison so a wrong guess cannot be
 * narrowed down by timing the response.
 */

const COOKIE = "thehood_admin";
/** How long one sitting of the admin area lasts. */
const TTL_SECONDS = 60 * 60 * 12;

function secret(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value) {
    throw new Error("ADMIN_SECRET is not set, so the admin area cannot be opened.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Constant-time check of a candidate secret against the real one. */
export function secretMatches(candidate: string): boolean {
  let expected: string;
  try {
    expected = secret();
  } catch {
    return false;
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Open a session. Only ever called from a Server Action. */
export async function startSession(): Promise<void> {
  const expires = Date.now() + TTL_SECONDS * 1000;
  const payload = String(expires);
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

/** Whether this request is staff. */
export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const separator = raw.lastIndexOf(".");
  if (separator < 1) return false;

  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

/**
 * A login throttle.
 *
 * Five wrong guesses from one address locks that address out for a quarter of
 * an hour. The counters live in this instance's memory, so on a serverless
 * deployment the lockout is per instance rather than global, which is weaker
 * than a shared store and worth knowing about. It exists to make guessing
 * slow, not to make it impossible.
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
