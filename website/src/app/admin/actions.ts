"use server";

import { revalidatePath, refresh, updateTag } from "next/cache";
import { headers } from "next/headers";
import {
  addStudents,
  removeStudent,
  setMark,
  setMarksBulk,
} from "@/lib/attendance-db";
import { deleteFile, MAX_UPLOAD_BYTES, renameFile, uploadFile } from "@/lib/files";
import { announceApproval, announceMaterial } from "@/lib/push";
import { COURSES } from "@/lib/resources";
import {
  clearFailures,
  currentStaff,
  endSession,
  loginBlocked,
  recordFailure,
  startSession,
} from "@/lib/admin-session";
import {
  approveStaff,
  findStaff,
  isSuper,
  listPending,
  reissueCode,
  rejectStaff,
  reinstateStaff,
  removeStaff,
  requestStaff,
  revokeStaff,
  setPermissions,
  setRole,
  touchStaff,
  verifySecret,
  writeAudit,
  PERMISSIONS,
  PERMISSION_LABEL,
  can,
  type Permission,
  type StaffRole,
} from "@/lib/staff";
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

/** A super admin, for the things only a super admin may do. */
async function requireSuper(): Promise<StaffMember> {
  const member = await requireStaff();
  if (!isSuper(member)) {
    throw new Error("Only a super admin can do that.");
  }
  return member;
}

/**
 * Somebody who holds a particular permission.
 *
 * The interface hides the parts of the staff area a person may not use, but
 * hiding is a convenience and not a protection. An action is reachable by a
 * direct POST, so the permission is checked here, next to the data.
 */
async function requirePermission(permission: Permission): Promise<StaffMember> {
  const member = await requireStaff();
  if (!can(member, permission)) {
    throw new Error(
      `You have not been allowed to ${PERMISSION_LABEL[permission].toLowerCase()}.`
    );
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
  /** Set once the code was right. The interface does the navigating. */
  ok?: boolean;
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

  if (!member) {
    recordFailure(key);
    return { error: "That name and code do not match." };
  }

  if (member.status === "pending") {
    return {
      error:
        "Your account is still waiting for a super admin to approve it. Nothing is wrong with the code; there is not a code yet.",
    };
  }

  if (member.status === "revoked" || member.status === "rejected") {
    recordFailure(key);
    return { error: "That account is not active any more." };
  }

  if (!member.secret_hash || !verifySecret(code, member.secret_hash)) {
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
  return { ok: true };
}

export async function logout(): Promise<void> {
  await endSession();
  revalidatePath("/admin");
  // No redirect from here. The caller navigates, because the bar has to be
  // told the session is gone before it goes on showing the staff links.
}

/* ---------------------------------------------------------------- staff */

export interface StaffState {
  error?: string;
  /** A code, shown once, to the person who added them. */
  code?: string;
  name?: string;
  /** Set when the code has been read and is no longer available. */
  expired?: boolean;
}

function parsePermissions(formData: FormData): Permission[] {
  const wanted = formData.getAll("permissions").map(String);
  return PERMISSIONS.filter((p) => wanted.includes(p));
}

/**
 * Add somebody to the queue.
 *
 * They do not exist as staff until a super admin says so. The person who
 * added them gets the code once it is approved, for two days, and passes it
 * on.
 */
export async function addStaffMember(
  _prev: StaffState,
  formData: FormData
): Promise<StaffState> {
  const staff = await requirePermission("staff");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) return { error: "Who is it for?" };
  if (email && !email.includes("@")) {
    return { error: "That does not look like an email address." };
  }

  const permissions = parsePermissions(formData);
  if (permissions.length === 0) {
    return { error: "Give them at least one thing to be allowed to do." };
  }

  const { listStaff } = await import("@/lib/staff");
  const existing = await listStaff();
  if (existing.some((m) => m.name.toLowerCase() === name.toLowerCase() && m.status !== "revoked")) {
    return { error: "Someone with that name is already on the list." };
  }

  await requestStaff({
    name,
    email: email || undefined,
    permissions,
    addedBy: staff.id,
    addedByName: staff.name,
  });

  await writeAudit({
    actor: staff,
    action: "requested",
    targetName: name,
    detail: permissions.join(", "),
  });

  // The super admins are told somebody is waiting. Awaited for the same
  // reason the material announcement is: a function can sleep before a push
  // that was never sent goes anywhere.
  await announceApproval(name, staff.name);

  revalidatePath("/admin");
  return { name, expired: false };
}

/** Approve somebody and issue their code. */
export async function approveStaffMember(id: string): Promise<void> {
  const staff = await requireSuper();
  await approveStaff(id, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/** Say no. */
export async function rejectStaffMember(
  id: string,
  reason?: string
): Promise<void> {
  const staff = await requireSuper();
  await rejectStaff(id, { id: staff.id, name: staff.name }, reason);
  revalidatePath("/admin");
}

/** Take somebody's access away. */
export async function revokeStaffMember(
  id: string,
  reason?: string
): Promise<void> {
  const staff = await requireSuper();
  await revokeStaff(id, { id: staff.id, name: staff.name }, reason);
  revalidatePath("/admin");
}

/** Put somebody back, with a new code. */
export async function reinstateStaffMember(id: string): Promise<void> {
  const staff = await requireSuper();
  await reinstateStaff(id, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/** Change what somebody may do. */
export async function changePermissions(
  id: string,
  permissions: Permission[]
): Promise<void> {
  const staff = await requireSuper();
  await setPermissions(id, permissions, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/** Change somebody's role. */
export async function changeRole(id: string, role: StaffRole): Promise<void> {
  const staff = await requireSuper();
  await setRole(id, role, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/** Take somebody off the list. */
export async function removeStaffMember(id: string): Promise<void> {
  const staff = await requireSuper();
  await removeStaff(id, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/** Issue a fresh code for somebody who has lost theirs. */
export async function reissueStaffCode(id: string): Promise<void> {
  const staff = await requireSuper();
  await reissueCode(id, { id: staff.id, name: staff.name });
  revalidatePath("/admin");
}

/**
 * Read the code of somebody this admin added.
 *
 * Only for two days after it was issued, and only for the person who added
 * them or a super admin.
 */
export async function readStaffCode(
  id: string
): Promise<{ code: string | null; reason: string }> {
  const staff = await requireStaff();
  const { readCode, getStaff } = await import("@/lib/staff");

  const member = await getStaff(id);
  if (!member) return { code: null, reason: "gone" };

  const mine = member.added_by === staff.id;
  if (!mine && !isSuper(staff)) {
    return { code: null, reason: "not yours" };
  }

  const result = await readCode(id);
  return {
    code: result.code,
    reason: result.reason === "ok" ? "ok" : result.reason,
  };
}

/* ---------------------------------------------------------------- files */

export interface UploadState {
  error?: string;
  done?: string;
  /** The file as it now stands, so the list can be updated without asking again. */
  file?: {
    id: string;
    course: string;
    title: string;
    type: string;
    size: number | null;
    source: string;
  };
}

/**
 * Add a file to a course.
 *
 * The file goes to Supabase Storage and the index row is written after it,
 * so the course page never points at a file that is not there. The readers of
 * that course are told there is something new. This is event-driven: the
 * upload is the event, so nothing has to be scheduled.
 *
 * It is awaited rather than left to itself, because a serverless function
 * can be put to sleep the moment the response goes out, and a push that was
 * never sent is a push that never arrives.
 */
export async function uploadCourseFile(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const staff = await requirePermission("files");

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

  let created;
  try {
    created = await uploadFile({ course, title, file, uploadedBy: staff.name });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The upload failed." };
  }

  await announceMaterial({ course, title, uploadedBy: staff.name });

  updateTag("files");
  revalidatePath("/admin");
  revalidatePath(`/courses/${courseSlug(course)}`);

  return {
    done: `${title} was added to ${course}.`,
    file: {
      id: created.id,
      course: created.course,
      title: created.title,
      type: created.type,
      size: created.size ?? null,
      source: created.source,
    },
  };
}

/** Take an uploaded file away. */
export async function removeCourseFile(id: string): Promise<void> {
  await requirePermission("files");
  try {
    await deleteFile(id);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The file could not be removed."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
}

/**
 * Rename a file.
 *
 * The title is what a student reads on the course page, and a typo in it is
 * permanent otherwise. The name of the file itself does not change, because
 * changing it would break the link and the archive would be a lie.
 */
export async function renameCourseFile(
  id: string,
  title: string
): Promise<{ file: { id: string; title: string } }> {
  await requirePermission("files");
  const clean = title.trim();
  if (!clean) {
    throw new Error("A file needs a name.");
  }
  await renameFile(id, clean);
  updateTag("files");
  revalidatePath("/admin");
  revalidatePath("/courses");
  return { file: { id, title: clean } };
}

/** The slug for a course code, for the path to revalidate. */
function courseSlug(code: string): string {
  return COURSES.find((c) => c.code === code)?.slug ?? "";
}

/* ---------------------------------------------------------------- roll */

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
  await requirePermission("roster");

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
  await requirePermission("roster");
  await removeStudent(matric);
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
}

/* ------------------------------------------------------------- marking */

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
  const staff = await requirePermission("attendance");
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
  const staff = await requirePermission("attendance");
  await setMarksBulk({ ...payload, markedBy: staff.name });
  refresh();
}
