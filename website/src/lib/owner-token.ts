import "server-only";

import { createHmac } from "node:crypto";

/**
 * Proof that the holder created a given assignment, without a user account.
 *
 * The assignment form is fully public, so ownership cannot come from a
 * roster. Instead the server hands the creator an HMAC of the assignment id
 * at creation time; the browser keeps it in localStorage and presents it on
 * edits and deletes, where the server recomputes and compares it. The token
 * cannot be forged without the server secret, and the server stores
 * nothing. Staff moderate everything regardless.
 */

function secret(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value) throw new Error("ADMIN_SECRET is not configured.");
  return value;
}

export function ownerTokenFor(assignmentId: string): string {
  return createHmac("sha256", secret())
    .update(`assignment-owner:${assignmentId}`)
    .digest("hex")
    .slice(0, 40);
}

export function ownerTokenMatches(
  assignmentId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  try {
    return ownerTokenFor(assignmentId) === token;
  } catch {
    return false;
  }
}
