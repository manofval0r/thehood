/**
 * Who to contact, and how.
 *
 * The reps themselves are read from the same manifest as everything else, so
 * they cannot drift out of step with the timetable. This file holds only the
 * addresses, because those are the one thing the manifest does not know.
 *
 * No address is invented here. A plausible-looking address that nobody reads
 * is worse than no address at all: the student sends the question, waits,
 * and concludes the course has no rep.
 *
 * To switch this page on:
 *   1. set REPS_EMAIL to the department office or a shared inbox, and/or
 *   2. add per-rep addresses to REP_EMAILS, keyed by course code.
 * The page picks up either with no other change.
 */

/** Fallback address for every rep. Empty means no mail link is rendered. */
export const REPS_EMAIL = "";

/** Direct addresses, keyed by course code. Empty by design. */
export const REP_EMAILS: Record<string, string> = {};

export function repAddress(code: string): string {
  return REP_EMAILS[code] || REPS_EMAIL;
}

export function hasAnyAddress(): boolean {
  return Boolean(REPS_EMAIL) || Object.keys(REP_EMAILS).length > 0;
}

/**
 * Whether a course has someone to ask.
 *
 * The manifest carries "Pending" where a lecturer has not been assigned, and
 * the honorific is inconsistent across entries. Both are handled here rather
 * than in each component, so the contact page and the course page cannot
 * disagree about who a rep is.
 */
export function isUnassigned(lecturer: string): boolean {
  return !lecturer || lecturer.trim().toLowerCase() === "pending";
}

/** The name to show a student. */
export function repName(lecturer: string): string {
  return isUnassigned(lecturer) ? "To be announced" : lecturer;
}

/**
 * First name only, for inline copy like "Contact Steve".
 *
 * Strips a leading honorific so it does not read "Contact Dr", and skips it
 * entirely for an unassigned course, where there is nobody to contact.
 */
export function repFirstName(lecturer: string): string | null {
  if (isUnassigned(lecturer)) return null;
  const parts = lecturer.trim().split(/\s+/);
  const first = parts[0].replace(/^(dr|prof|mr|mrs|miss|ms|eng|engr)\.?\s+/i, "");
  return parts.length > 1 ? first : null;
}