"use server";

import { revalidatePath, refresh } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  addStudents,
  removeStudent,
  setMark,
  setMarksBulk,
} from "@/lib/attendance-db";
import {
  clearFailures,
  endSession,
  isAdmin,
  loginBlocked,
  recordFailure,
  secretMatches,
  startSession,
} from "@/lib/admin-session";

/**
 * Every action re-checks the session itself.
 *
 * A Server Action is reachable by a direct POST, so a check in the UI is a
 * convenience and not a protection. The check here, next to the data, is the
 * protection.
 */

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Not signed in.");
  }
}

/** The address a login attempt came from, for the throttle. */
async function attemptKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return ip;
}

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const candidate = String(formData.get("secret") ?? "");
  const key = await attemptKey();

  if (loginBlocked(key)) {
    return {
      error: "Too many attempts. Wait a quarter of an hour and try again.",
    };
  }

  if (!secretMatches(candidate)) {
    recordFailure(key);
    return { error: "That is not the staff code." };
  }

  clearFailures(key);
  await startSession();
  // The cookie is set, but the page the reader is looking at was rendered
  // before they had it. Without this the action returns only its value, the
  // route is not re-rendered, and the reader is left looking at the login
  // form they have just filled in.
  revalidatePath("/admin");
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  revalidatePath("/admin");
  redirect("/admin");
}

export interface MarkPayload {
  course: string;
  sessionDate: string;
  matric: string;
  /** 0 to 1, or null for unmarked. */
  fill: number | null;
  excused: boolean;
}

/** Mark one box. */
export async function markBox(payload: MarkPayload): Promise<void> {
  await requireAdmin();
  await setMark({ ...payload, markedBy: "staff" });
  refresh();
}

/** Mark a whole class at once. */
export async function markClass(payload: {
  course: string;
  sessionDate: string;
  matrics: string[];
  fill: number | null;
  excused: boolean;
}): Promise<void> {
  await requireAdmin();
  await setMarksBulk({ ...payload, markedBy: "staff" });
  refresh();
}

export interface RosterState {
  error?: string;
  added?: number;
}

/**
 * Put students on the roll.
 *
 * The list is pasted as lines of "matric, name". A line with no comma is
 * ignored rather than guessed at, because a roster is the one thing in here
 * that has to be exactly right.
 */
export async function addToRoster(
  _prev: RosterState,
  formData: FormData
): Promise<RosterState> {
  await requireAdmin();

  const course = String(formData.get("course") ?? "").trim();
  const raw = String(formData.get("students") ?? "");

  if (!course) return { error: "Choose the course first." };

  const students: { matric: string; name: string; course: string }[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const comma = trimmed.indexOf(",");
    if (comma < 1) continue;

    const matric = trimmed.slice(0, comma).trim().toUpperCase();
    const name = trimmed.slice(comma + 1).trim();
    if (!matric || !name) continue;
    if (seen.has(matric)) continue;

    seen.add(matric);
    students.push({ matric, name, course });
  }

  if (students.length === 0) {
    return {
      error: "No usable lines. Each line needs a matric number and a name, separated by a comma.",
    };
  }

  await addStudents(students);
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  return { added: students.length };
}

/** Take a student off the roll. Their marks stay. */
export async function removeFromRoster(matric: string): Promise<void> {
  await requireAdmin();
  await removeStudent(matric);
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
}
