"use server";

import { revalidatePath, refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  addStudents,
  removeStudent,
  setMark,
  setMarksBulk,
} from "@/lib/attendance-db";
import { deleteFile, MAX_UPLOAD_BYTES, uploadFile } from "@/lib/files";
import { COURSES } from "@/lib/resources";
import {
  clearFailures,
  currentStaff,
  endSession,
  loginBlocked,
  recordFailure,
  startSession,
} from "@/lib/admin-session";
import { addStaff, findStaff, listStaff, removeStaff, setStaffActive as setStaffActiveRow, touchStaff, verifySecret } from "@/lib/staff";
import type { StaffMember } from "@/lib/staff";

/**
 * Every action re-checks the session itself.
 *
 * A Server Action is reachable by a direct POST, so a check in the UI is a
 * convenience and not a protection. The check here, next to the data, is the
 * protection.
 */

async function requireStaff(): Promise<StaffMember> {
  const member = await currentStaff();
  if (!member) {
    throw new Error("Not signed in.");
  }
  return member;
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
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const key = await attemptKey();

  if (loginBlocked(key)) {
    return {
      error: "Too many attempts. Wait a quarter of an hour and try again.",
    };
  }

  const member = await findStaff(name);

  if (!member || !member.active || !verifySecret(code, member.secret_hash)) {
    recordFailure(key);
    return { error: "That name and code do not match." };
  }

  clearFailures(key);
  await startSession(member.id);
  await touchStaff(member.id);

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
  const staff = await requireStaff();
  await setMark({ ...payload, markedBy: staff.name });
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
  const staff = await requireStaff();
  await setMarksBulk({ ...payload, markedBy: staff.name });
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
  const staff = await requireStaff();

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
  const staff = await requireStaff();
  await removeStudent(matric);
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
}

/* ---------------------------------------------------------------- files */

export interface UploadState {
  error?: string;
  done?: string;
}

/**
 * Add a file to a course.
 *
 * The file goes to Supabase Storage and the index row is written after it,
 * so the course page never points at a file that is not there. The index is
 * tagged afterwards, which is what makes the new file appear on the course
 * page, in the search and in the counts without a rebuild.
 */
export async function uploadCourseFile(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const staff = await requireStaff();

  const course = String(formData.get("course") ?? "").trim();
  const file = formData.get("file");

  if (!course) return { error: "Choose the course first." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`,
    };
  }

  const title =
    String(formData.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");

  try {
    await uploadFile({ course, title, file, uploadedBy: staff.name });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The upload failed." };
  }

  updateTag("files");
  revalidatePath("/admin");
  revalidatePath(`/courses/${courseSlug(course)}`);
  // The list on this page is rendered on the server, so the router has to be
  // asked for it again. Without this the upload succeeds and the file does
  // not appear in the list until the page is reloaded.
  refresh();

  return { done: `${title} was added to ${course}.` };
}

/** Take an uploaded file away. */
export async function removeCourseFile(id: string): Promise<void> {
  const staff = await requireStaff();
  try {
    await deleteFile(id);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The file could not be removed."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
  refresh();
}

/** The slug for a course code, for the path to revalidate. */
function courseSlug(code: string): string {
  return COURSES.find((c) => c.code === code)?.slug ?? "";
}

/* ---------------------------------------------------------------- staff */

export interface StaffState {
  error?: string;
  /** The code, shown once. Only a hash of it is kept. */
  code?: string;
  name?: string;
}

/**
 * Put someone on the staff list.
 *
 * Their code is made here and shown once. It cannot be read back afterwards,
 * because only a hash of it is kept, so if it is lost a new one is made and
 * the old one stops working.
 */
export async function addStaffMember(
  _prev: StaffState,
  formData: FormData
): Promise<StaffState> {
  await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) return { error: "Who is it for?" };
  if (email && !email.includes("@")) {
    return { error: "That does not look like an email address." };
  }

  const existing = await listStaff();
  if (
    existing.some(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.active
    )
  ) {
    return { error: "Someone with that name is already on the list." };
  }

  const { member, code } = await addStaff(name, email || undefined);
  revalidatePath("/admin");

  return { code, name: member.name };
}

/** Let someone back in, or lock them out, without making them a new person. */
export async function setStaffActive(
  id: string,
  active: boolean
): Promise<void> {
  await requireStaff();
  await setStaffActiveRow(id, active);
  revalidatePath("/admin");
}

/** Take someone off the list. Their marks stay where they are. */
export async function removeStaffMember(id: string): Promise<void> {
  await requireStaff();
  await removeStaff(id);
  revalidatePath("/admin");
}
