import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { rest } from "@/lib/rest";
import {
  PERMISSIONS,
  type Permission,
  type StaffRole,
  type StaffStatus,
} from "@/lib/permissions";

export {
  PERMISSIONS,
  PERMISSION_LABEL,
  PERMISSION_HELP,
  can,
  isSuper,
  type Permission,
  type StaffRole,
  type StaffStatus,
} from "@/lib/permissions";

/**
 * The people allowed into the staff area, and the two kinds of them.
 *
 * A **super admin** approves people, takes access away, and reads the audit
 * log. There are two or three of them.
 *
 * An **admin** does the day-to-day work: marks attendance, uploads files,
 * keeps the roll. They can also add people, but the people they add go into
 * a review queue and wait for a super admin before they can sign in at all.
 *
 * Codes are never stored in the clear. What is kept is a scrypt hash for
 * checking a sign-in, and separately an encrypted copy that the person who
 * added somebody can read for two days so they can pass the code on. After
 * that the encrypted copy is destroyed and the code has to be reissued.
 */

export interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: StaffRole;
  status: StaffStatus;
  permissions: Permission[];
  added_by: string | null;
  added_by_name: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  last_seen_at: string | null;
  /** When the code can still be read, if it has been issued. */
  code_visible_until: string | null;
}

interface StaffRow extends StaffMember {
  secret_hash: string;
  code_cipher: string | null;
}

/** How long an issued code can still be read and passed on. */
export const CODE_WINDOW_HOURS = 48;

/* --------------------------------------------------------------- crypto */

/** scrypt, stored as "salt:hash" in hex. */
export function hashSecret(secret: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(secret, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

/** Check a code against a stored hash, in constant time. */
export function verifySecret(secret: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = scryptSync(secret, salt, 32);
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The key the issued code is encrypted with.
 *
 * Derived from ADMIN_SECRET, so rotating that secret makes every issued
 * code unreadable, which is the same as saying those codes no longer exist.
 */
function cipherKey(): Buffer {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET is not set, so no code can be issued.");
  }
  return createHash("sha256").update(`staff-code:${secret}`).digest();
}

/** Encrypt a code so it can be read for a while and not for ever. */
export function encryptCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const enc = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptCode(ciphertext: string): string | null {
  try {
    const [iv, tag, enc] = ciphertext.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", cipherKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * A code to hand to a person.
 *
 * Long, and without the characters that get mistyped when they are read out
 * of a message. No 0 or O, no 1 or l.
 */
export function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const blocks: string[] = [];
  for (let b = 0; b < 4; b++) {
    let block = "";
    for (let i = 0; i < 5; i++) {
      block += alphabet[randomBytes(1)[0] % alphabet.length];
    }
    blocks.push(block);
  }
  return blocks.join("-");
}

/* ------------------------------------------------------------- reading */

const SELECT =
  "id,name,email,role,status,permissions,added_by,added_by_name,reviewed_by,reviewed_at,revoked_at,revoked_reason,created_at,last_seen_at,code_visible_until";

function toMember(row: StaffRow): StaffMember {
  const { secret_hash: _h, code_cipher: _c, ...safe } = row;
  return {
    ...safe,
    permissions: (safe.permissions ?? []) as Permission[],
  };
}

/** Everyone, for a super admin. */
export async function listStaff(): Promise<StaffMember[]> {
  const rows = await rest<StaffRow[]>(`staff?select=${SELECT}&order=name`);
  return (rows ?? []).map(toMember);
}

/** The people one admin added, with their codes readable if still in window. */
export async function listAddedBy(adderId: string): Promise<StaffMember[]> {
  const rows = await rest<StaffRow[]>(
    `staff?added_by=eq.${encodeURIComponent(adderId)}&select=${SELECT}&order=created_at.desc`
  );
  return (rows ?? []).map(toMember);
}

/** The queue of people waiting for a super admin. */
export async function listPending(): Promise<StaffMember[]> {
  const rows = await rest<StaffRow[]>(
    `staff?status=eq.pending&select=${SELECT}&order=created_at`
  );
  return (rows ?? []).map(toMember);
}

export async function getStaff(
  id: string
): Promise<(StaffMember & { secret_hash: string; code_cipher: string | null }) | undefined> {
  const rows = await rest<StaffRow[]>(
    `staff?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  const row = rows?.[0];
  if (!row) return undefined;
  return row;
}

/** One person, by the name they sign in with. */
export async function findStaff(
  name: string
): Promise<(StaffMember & { secret_hash: string }) | undefined> {
  const rows = await rest<(StaffMember & { secret_hash: string })[]>(
    `staff?name=eq.${encodeURIComponent(name)}&select=*&limit=1`
  );
  const row = rows?.[0];
  if (!row) return undefined;
  return { ...row, permissions: (row.permissions ?? []) as Permission[] };
}

/* ------------------------------------------------------------- writing */

/**
 * Put somebody in the queue.
 *
 * They are not active and they have no code. Nothing about them works until
 * a super admin approves them, and only then is a code made.
 */
export async function requestStaff(args: {
  name: string;
  email?: string;
  permissions: Permission[];
  addedBy: string;
  addedByName: string;
  /** Whether they are a super admin. Defaults to admin. */
  role?: StaffRole;
}): Promise<StaffMember> {
  const id = `st_${randomUUID().slice(0, 8)}`;

  const rows = await rest<StaffRow[]>(`staff?select=${SELECT}`, {
    method: "POST",
    body: {
      id,
      name: args.name,
      email: args.email?.trim() || null,
      role: args.role ?? "admin",
      status: "pending",
      permissions: args.permissions,
      added_by: args.addedBy,
      added_by_name: args.addedByName,
    },
    prefer: "return=representation",
  });

  return toMember(rows[0]);
}

/**
 * Approve somebody: make them active and issue their code.
 *
 * The code is readable by the person who added them, and by a super admin,
 * for two days. After that it is destroyed and has to be reissued.
 */
export async function approveStaff(
  id: string,
  by: { id: string; name: string }
): Promise<{ member: StaffMember; code: string }> {
  const code = generateCode();
  const until = new Date(Date.now() + CODE_WINDOW_HOURS * 3600 * 1000).toISOString();

  const rows = await rest<StaffRow[]>(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "active",
      secret_hash: hashSecret(code),
      code_cipher: encryptCode(code),
      code_visible_until: until,
      reviewed_by: by.id,
      reviewed_at: new Date().toISOString(),
      revoked_at: null,
      revoked_reason: null,
    },
    prefer: "return=representation",
  });

  await writeAudit({
    actor: by,
    action: "approved",
    targetId: id,
    targetName: rows[0]?.name,
    detail: "Approved, and a code was issued.",
  });

  return { member: toMember(rows[0]), code };
}

/** Say no. */
export async function rejectStaff(
  id: string,
  by: { id: string; name: string },
  reason?: string
): Promise<void> {
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "rejected",
      reviewed_by: by.id,
      reviewed_at: new Date().toISOString(),
      secret_hash: hashSecret(generateCode()),
      code_cipher: null,
      code_visible_until: null,
    },
  });
  await writeAudit({
    actor: by,
    action: "rejected",
    targetId: id,
    targetName: member?.name,
    detail: reason?.trim() || null,
  });
}

/** Take access away entirely. */
export async function revokeStaff(
  id: string,
  by: { id: string; name: string },
  reason?: string
): Promise<void> {
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_reason: reason?.trim() || null,
      code_cipher: null,
      code_visible_until: null,
    },
  });
  await writeAudit({
    actor: by,
    action: "revoked",
    targetId: id,
    targetName: member?.name,
    detail: reason?.trim() || null,
  });
}

/** Put somebody back, with a fresh code. */
export async function reinstateStaff(
  id: string,
  by: { id: string; name: string }
): Promise<{ member: StaffMember; code: string }> {
  const code = generateCode();
  const until = new Date(Date.now() + CODE_WINDOW_HOURS * 3600 * 1000).toISOString();
  const rows = await rest<StaffRow[]>(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "active",
      secret_hash: hashSecret(code),
      code_cipher: encryptCode(code),
      code_visible_until: until,
      revoked_at: null,
      revoked_reason: null,
    },
    prefer: "return=representation",
  });
  await writeAudit({
    actor: by,
    action: "reinstated",
    targetId: id,
    targetName: rows[0]?.name,
    detail: "Access restored, and a new code was issued.",
  });
  return { member: toMember(rows[0]), code };
}

/** Change what somebody may do. */
export async function setPermissions(
  id: string,
  permissions: Permission[],
  by: { id: string; name: string }
): Promise<void> {
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { permissions },
  });
  await writeAudit({
    actor: by,
    action: "permissions",
    targetId: id,
    targetName: member?.name,
    detail: permissions.join(", ") || "none",
  });
}

/** Change somebody's role. */
export async function setRole(
  id: string,
  role: StaffRole,
  by: { id: string; name: string }
): Promise<void> {
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { role },
  });
  await writeAudit({
    actor: by,
    action: "role",
    targetId: id,
    targetName: member?.name,
    detail: role,
  });
}

/** Take somebody off the list. */
export async function removeStaff(
  id: string,
  by: { id: string; name: string }
): Promise<void> {
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  await writeAudit({
    actor: by,
    action: "removed",
    targetId: id,
    targetName: member?.name,
    detail: null,
  });
}

/** Note that somebody was here. */
export async function touchStaff(id: string): Promise<void> {
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { last_seen_at: new Date().toISOString() },
  });
}

/**
 * Read an issued code, if it is still within its window.
 *
 * Past the window the encrypted copy is destroyed rather than merely hidden,
 * so there is nothing left to decrypt even by someone with the key.
 */
export async function readCode(
  id: string
): Promise<{ code: string | null; reason: "ok" | "expired" | "none" }> {
  const member = await getStaff(id);
  if (!member) return { code: null, reason: "none" };

  if (!member.code_cipher) return { code: null, reason: "none" };

  if (!member.code_visible_until || new Date(member.code_visible_until) <= new Date()) {
    await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { code_cipher: null, code_visible_until: null },
    });
    return { code: null, reason: "expired" };
  }

  const code = decryptCode(member.code_cipher);
  if (!code) return { code: null, reason: "expired" };
  return { code, reason: "ok" };
}

/** Issue a fresh code, replacing whatever was there. */
export async function reissueCode(
  id: string,
  by: { id: string; name: string }
): Promise<{ code: string }> {
  const code = generateCode();
  const until = new Date(Date.now() + CODE_WINDOW_HOURS * 3600 * 1000).toISOString();
  const member = await getStaff(id);
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      secret_hash: hashSecret(code),
      code_cipher: encryptCode(code),
      code_visible_until: until,
    },
  });
  await writeAudit({
    actor: by,
    action: "reissued",
    targetId: id,
    targetName: member?.name,
    detail: "A new code was issued.",
  });
  return { code };
}

/* --------------------------------------------------------------- audit */

export interface AuditEntry {
  id: number;
  at: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target_id: string | null;
  target_name: string | null;
  detail: string | null;
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const rows = await rest<AuditEntry[]>(
    `staff_audit?select=*&order=at.desc&limit=${limit}`
  );
  return rows ?? [];
}

/** Write an entry into the audit log. */
export async function writeAudit(entry: {
  actor: { id: string; name: string };
  action: string;
  targetId?: string;
  targetName?: string;
  detail?: string | null;
}): Promise<void> {
  await rest("staff_audit", {
    method: "POST",
    body: {
      actor_id: entry.actor.id,
      actor_name: entry.actor.name,
      action: entry.action,
      target_id: entry.targetId ?? null,
      target_name: entry.targetName ?? null,
      detail: entry.detail ?? null,
    },
    prefer: "return=minimal",
  });
}

/* ----------------------------------------------------------- authority */

/* `can` and `isSuper` are re-exported from ./permissions near the top of
 * this file, so that everything about a staff member can be imported from
 * one place. */
