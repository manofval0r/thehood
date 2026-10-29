import "server-only";

import { cookies } from "next/headers";
import { rest } from "@/lib/rest";
import {
  readStudentToken,
  sealStudentToken,
  type VerifiedStudentToken,
} from "@/lib/student-session-token";
import {
  matchesRosterIdentity,
  normalizeMatric,
  type RosterIdentity,
} from "@/lib/student-verification";

const COOKIE = "cybersec_student";
const TTL_SECONDS = 60 * 60 * 24 * 30;

export interface VerifiedStudent {
  matric: string;
  name: string;
}

function secret(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value) throw new Error("ADMIN_SECRET is not configured.");
  return value;
}

export async function verifyRosterIdentity(
  matric: string,
  surname: string
): Promise<VerifiedStudent | null> {
  const normalized = normalizeMatric(matric);
  if (!normalized || !surname.trim()) return null;

  const rows = await rest<RosterIdentity[]>(
    `roster?matric=eq.${encodeURIComponent(
      normalized
    )}&select=matric,name,course&limit=10`
  );
  const row = (rows ?? []).find((candidate) =>
    matchesRosterIdentity(candidate, normalized, surname)
  );
  return row ? { matric: row.matric, name: row.name } : null;
}

export async function startStudentSession(
  student: VerifiedStudent
): Promise<void> {
  const expiresAt = Date.now() + TTL_SECONDS * 1000;
  const token = sealStudentToken(student, secret(), expiresAt);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endStudentSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function currentStudent(): Promise<VerifiedStudent | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;

  let token: VerifiedStudentToken | null;
  try {
    token = readStudentToken(value, secret());
  } catch {
    return null;
  }
  if (!token) return null;

  return { matric: token.matric, name: token.name };
}
