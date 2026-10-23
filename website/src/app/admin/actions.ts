"use server";

import { revalidatePath, refresh, updateTag } from "next/cache";
import { headers } from "next/headers";
import {
  addStudents,
  removeStudent,
  setMark,
  setMarksBulk,
} from "@/lib/attendance-db";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  MAX_UPLOAD_BYTES,
  moveFileToFolder,
  renameFile,
  renameFolder,
  uploadFile,
} from "@/lib/files";
import { addVideo, removeVideo, updateVideo } from "@/lib/videos";
import { setBreak } from "@/lib/break-store";
import { announceTest } from "@/lib/push";
import { announceApproval, announceMaterial, announceBroadcast } from "@/lib/push";
import {
  cancelAnnouncement as cancelAnnouncementRow,
  createAnnouncement,
  getAnnouncement,
  recordDelivery,
} from "@/lib/announcements";
import {
  TEMPLATE_BY_ID,
  type AnnouncementTemplate,
} from "@/lib/announcement-templates";
import { CATALOGUE, sampleFor } from "@/lib/notification-catalogue";
import { setKindEnabled } from "@/lib/notification-settings";
import { KINDS, type NotificationKind } from "@/lib/notification-kinds";
import { COURSES } from "@/lib/resources";
import { randomUUID } from "node:crypto";
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
  _prev: LoginState | null,
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

  // The page is loaded again by the browser, with the cookie on it.
  //
  // The action must not re-render the route it was called from. If it
  // did, the form that made the action would be taken off the screen, and
  // a component that is not on the screen cannot navigate: the bar would
  // go on showing the student's links to somebody who had just signed in.
  //
  // So the action says that it worked, and the browser does the loading.
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

  // Only a super admin can make somebody a super admin. Anybody else who can
  // add staff makes them an ordinary admin.
  const role =
    staff.role === "super" && formData.get("role") === "super"
      ? "super"
      : "admin";

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
    role,
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
    url: string;
    size: number | null;
    source: string;
    folder?: string | null;
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
  const folder = String(formData.get("folder") ?? "").trim();
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
    created = await uploadFile({
      course,
      title,
      file,
      uploadedBy: staff.name,
      folder,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The upload failed." };
  }

  await announceMaterial({ course, title, uploadedBy: staff.name });

  updateTag("files");
  revalidatePath("/admin");
  revalidatePath(`/courses/${courseSlug(course)}`);

  return {
    done: `${title} was added to ${course}${folder ? ` in ${folder}` : ""}.`,
    file: {
      id: created.id,
      course: created.course,
      title: created.title,
      type: created.type,
      url: created.url,
      size: created.size ?? null,
      source: created.source,
      folder: created.folder ?? null,
    },
  };
}

/**
 * Move a file into a folder.
 *
 * The file does not move on disk and the object does not move in the bucket.
 * The index says where it is, and that is what a student is shown and what a
 * zip is built from. So a move is one column and it is instant.
 */
export async function moveCourseFile(
  id: string,
  folder: string
): Promise<void> {
  await requirePermission("files");
  try {
    await moveFileToFolder(id, folder);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The file could not be moved."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
}

/** Make a folder in a course. */
export async function createCourseFolder(
  course: string,
  path: string
): Promise<void> {
  await requirePermission("files");
  try {
    await createFolder(course, path);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The folder could not be made."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
}

/** Rename a folder. Everything inside it moves with it. */
export async function renameCourseFolder(
  course: string,
  from: string,
  to: string
): Promise<void> {
  await requirePermission("files");
  try {
    await renameFolder(course, from, to);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The folder could not be renamed."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
}

/** Remove a folder. Only an empty one. */
export async function deleteCourseFolder(
  course: string,
  path: string
): Promise<void> {
  await requirePermission("files");
  try {
    await deleteFolder(course, path);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The folder could not be removed."
    );
  }
  updateTag("files");
  revalidatePath("/admin");
}

/**
 * Set the break in a lecture.
 *
 * Any member of staff can do this. A break is a fact about a lecture, and
 * the people who teach are the people who know it. The length is set per
 * session, because a lecturer's coffee break is not the same as a
 * practical's, and because one lecture in a week may run straight through
 * while the other has a proper break.
 */
export async function setSessionBreak(args: {
  course: string;
  dayIndex: number;
  startMin: number;
  breakMin: number;
}): Promise<void> {
  const staff = await requireStaff();
  try {
    await setBreak({
      course: args.course,
      dayIndex: args.dayIndex,
      startMin: args.startMin,
      breakMin: args.breakMin,
      by: staff.name,
    });
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The break could not be changed."
    );
  }
  revalidatePath("/admin/settings/breaks");
  revalidatePath("/timetable");
  // The countdown is in the bar, so the break has to reach the layout and
  // everything under it, not only the pages that show the timetable.
  revalidatePath("/", "layout");
}

/**
 * Send a test notification to the device that asked for it.
 *
 * Only a super admin, and only to one device: the one that pressed the
 * button. The point is to check that the push keys, the service worker and
 * the browser are in order, and a test that lands on every reader's phone
 * is not a test.
 */
export async function sendTestNotification(
  deviceId: string
): Promise<{ ok: boolean; message: string }> {
  const staff = await requireSuper();
  if (!deviceId) {
    return {
      ok: false,
      message: "This browser has no id, so there is nothing to send to.",
    };
  }

  const result = await announceTest(deviceId, staff.name);

  if (result === "sent") {
    return {
      ok: true,
      message: "Sent. It should arrive in a moment, even in your quiet hours.",
    };
  }
  if (result === "not-found") {
    return {
      ok: false,
      message:
        "This browser has no subscription, so there is nothing to send to. Turn the notifications on in the bell first.",
    };
  }
  return {
    ok: false,
    message:
      "The push could not be sent. The keys may be wrong, or the push service may be refusing it.",
  };
}

/* --------------------------------------------------------- announcements */

export interface AnnouncementState {
  error?: string;
  done?: string;
  /** How many devices it reached, how many it did not. */
  counts?: { sent: number; skipped: number; gone: number; failed: number };
  /** The id, so the composer can clear itself and the history can show it. */
  id?: string;
  /** Whether it was sent now or left for later. */
  scheduled?: boolean;
}

/**
 * Send a message to the students.
 *
 * Only a super admin. This is the one thing on the site that says something
 * to everybody at once, and a message that says the wrong thing at the
 * wrong time is not a mistake an ordinary admin should be able to make.
 *
 * It is awaited rather than left to itself, because a serverless function
 * can be put to sleep the moment the response goes out, and a push that was
 * never sent is a push that never arrives.
 */
export async function sendAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const staff = await requireSuper();

  const template = String(formData.get("template") ?? "message") as
    | AnnouncementTemplate
    | "message";
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim() || null;
  const href = String(formData.get("href") ?? "").trim() || null;
  const urgent = formData.get("urgent") === "on";
  const needsAck = formData.get("needsAck") === "on";
  const when = String(formData.get("when") ?? "").trim();

  if (!title) return { error: "The message needs a title." };
  if (!body) return { error: "The message needs something to say." };
  if (title.length > 120) {
    return { error: "The title is too long. Notifications show about a line." };
  }
  if (body.length > 300) {
    return { error: "The message is too long. Notifications show about three lines." };
  }

  // A scheduled message is a message for a particular moment, and the
  // moment is in Lagos, because the students are in Lagos and the server
  // is not.
  let scheduledFor: string | null = null;
  if (when) {
    const parsed = new Date(when);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "That is not a time we can read." };
    }
    if (parsed.getTime() <= Date.now()) {
      return { error: "That time has already passed." };
    }
    scheduledFor = parsed.toISOString();
  }

  const kind = TEMPLATE_BY_ID[template]?.kind ?? "system";

  const id = `an_${randomUUID().slice(0, 8)}`;

  await createAnnouncement({
    id,
    title,
    body,
    kind,
    course,
    href,
    urgent,
    needsAck,
    status: scheduledFor ? "scheduled" : "sent",
    scheduledFor,
    by: { id: staff.id, name: staff.name },
  });

  await writeAudit({
    actor: staff,
    action: scheduledFor ? "scheduled" : "announced",
    targetId: id,
    targetName: title,
    detail: [
      course ? `for ${course}` : "for everybody",
      urgent ? "urgent" : null,
      needsAck ? "asking for a confirmation" : null,
      scheduledFor ? `for ${scheduledFor}` : null,
    ]
      .filter(Boolean)
      .join(", "),
  });

  // A message left for later is sent by the scheduler, which runs every
  // five minutes, so it goes out within five minutes of its time.
  if (scheduledFor) {
    revalidatePath("/admin/announce");
    return {
      done: "It will go out at the time you asked for.",
      id,
      scheduled: true,
    };
  }

  const counts = await announceBroadcast({
    id,
    title,
    body,
    kind,
    course,
    href,
    urgent,
  });

  await recordDelivery(id, counts);

  revalidatePath("/admin/announce");
  revalidatePath("/", "layout");

  return {
    done: whatHappened(counts),
    counts,
    id,
  };
}

/**
 * What the send actually did.
 *
 * The three failures are different and the person who sent the message
 * needs to be able to tell them apart. "Nobody has turned their
 * notifications on" is a fact about the readers. "The push service
 * refused it" is a fact about the site, and it is the one that needs
 * somebody to do something about it.
 */
function whatHappened(counts: {
  sent: number;
  skipped: number;
  gone: number;
  failed: number;
}): string {
  if (counts.sent > 0) {
    return `Sent to ${counts.sent} device${counts.sent === 1 ? "" : "s"}.`;
  }
  if (counts.failed > 0) {
    return "The push service refused it, so it did not go out. The push keys may be wrong.";
  }
  if (counts.gone > 0) {
    return "Every subscription for it had gone, so it did not go out. Nobody will see it.";
  }
  if (counts.skipped > 0) {
    return "Nobody was sent it. Every device had turned that kind off, or was in their quiet hours.";
  }
  return "There is nobody to send it to yet. Nobody has turned their notifications on.";
}

/** Stop a message that has not gone out yet. */
export async function cancelScheduledAnnouncement(id: string): Promise<void> {
  const staff = await requireSuper();
  const announcement = await getAnnouncement(id);
  if (!announcement) throw new Error("That message is not there.");
  if (announcement.status !== "scheduled") {
    throw new Error("That message has already gone out.");
  }

  await cancelAnnouncementRow(id);
  await writeAudit({
    actor: staff,
    action: "cancelled",
    targetId: id,
    targetName: announcement.title,
    detail: "It was going to be sent later and will not be.",
  });
  revalidatePath("/admin/announce");
}

/**
 * Turn a kind of notification on or off, for everybody.
 *
 * Only a super admin. A reader chooses what they want to be told about;
 * this is what the site is allowed to tell anybody.
 */
export async function setNotificationKind(
  kind: string,
  enabled: boolean
): Promise<void> {
  await requireSuper();

  if (!(KINDS as string[]).includes(kind)) {
    throw new Error("There is no such kind of notification.");
  }

  await setKindEnabled(kind as NotificationKind, enabled);
  revalidatePath("/admin/settings/notifications");
}

/**
 * Send one of the site's notifications to this device, to see what it
 * looks like.
 *
 * Only a super admin, and only to one device: the one that pressed the
 * button. The point is to find out whether the push keys, the service
 * worker and the browser are in order, and a test that lands on every
 * reader's phone is not a test.
 *
 * It ignores the quiet hours, because a test that does not arrive because
 * it is the middle of the night says nothing about the keys.
 */
export async function sendNotificationTest(
  id: string,
  deviceId: string
): Promise<{ ok: boolean; message: string }> {
  const staff = await requireSuper();

  if (!deviceId) {
    return {
      ok: false,
      message: "This browser has no id, so there is nothing to send to.",
    };
  }

  const entry = CATALOGUE.find((c) => c.id === id);
  if (!entry) {
    return { ok: false, message: "There is no such notification." };
  }

  const sample = sampleFor(entry.id);
  const result = await announceTest(
    deviceId,
    staff.name,
    {
      kind: entry.kind,
      title: sample.title,
      body: sample.body,
      href: sample.href,
      course: sample.course,
    }
  );

  if (result === "sent") {
    return {
      ok: true,
      message: `Sent. "${sample.title}" should arrive in a moment.`,
    };
  }
  if (result === "not-found") {
    return {
      ok: false,
      message:
        "This browser has no subscription, so there is nothing to send to. Turn the notifications on in the bell first.",
    };
  }
  return {
    ok: false,
    message:
      "The push could not be sent. The keys may be wrong, or the push service may be refusing it.",
  };
}

export interface VideoState {  error?: string;
  done?: string;
  /** The video as it now stands, so the list can be updated without asking again. */
  video?: {
    id: string;
    course: string;
    title: string;
    youtube_id: string;
    note: string | null;
    position: number;
    thumb_path: string | null;
  };
}

/**
 * Add a video to a course.
 *
 * The picture is fetched by the server and kept here, so a reader's browser
 * never asks YouTube for it. The video itself is played from YouTube when
 * somebody presses play.
 */
export async function addCourseVideo(
  _prev: VideoState,
  formData: FormData
): Promise<VideoState> {
  const staff = await requirePermission("files");

  const course = String(formData.get("course") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!course) return { error: "Choose the course first." };
  if (!url) return { error: "Paste the link to the video." };

  try {
    const created = await addVideo({
      course,
      url,
      title,
      note,
      addedBy: staff.name,
    });

    updateTag("videos");
    revalidatePath("/admin/resources");

    return {
      done: `Added to ${course}.`,
      video: {
        id: created.id,
        course: created.course,
        title: created.title,
        youtube_id: created.youtube_id,
        note: created.note,
        position: created.position,
        thumb_path: created.thumb_path,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The video was not added." };
  }
}

/** Take a video off a course. */
export async function removeCourseVideo(id: string): Promise<void> {
  await requirePermission("files");
  try {
    await removeVideo(id);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The video could not be removed."
    );
  }
  updateTag("videos");
  revalidatePath("/admin/resources");
}

/** Change what a video is called and what it says. */
export async function updateCourseVideo(
  id: string,
  title: string,
  note: string
): Promise<void> {
  await requirePermission("files");
  try {
    await updateVideo(id, title, note);
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : "The video could not be changed."
    );
  }
  updateTag("videos");
  revalidatePath("/admin/resources");
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
