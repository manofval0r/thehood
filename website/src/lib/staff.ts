import "server-only";

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { rest } from "@/lib/rest";

/**
 * The people allowed into the staff area.
 *
 * Each one has their own code. A code is only ever shown once, when it is
 * made, and what is stored is a scrypt hash of it with a salt, so the table
 * cannot be read to recover a way in. scrypt is deliberately slow, which is
 * the point: it is what makes guessing a code expensive for whoever is
 * guessing and cheap for the person who has to do it once.
 *
 * Per-person rather than one shared code for the department, because a
 * shared code cannot be taken back from one person without taking it from
 * all of them, and because a mark that says "staff" says nothing about who
 * made it. Attendance is a record that can be argued with, and an argument
 * needs a name.
 */

export interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
  created_at: string;
  last_seen_at: string | null;
}

interface StaffRow extends StaffMember {
  secret_hash: string;
}

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

/** Everyone on the staff list. */
export async function listStaff(): Promise<StaffMember[]> {
  // Ordered by the column, not by lower(name): PostgREST will not take a
  // function in the order clause.
  const rows = await rest<StaffRow[]>(
    "staff?select=id,name,email,active,created_at,last_seen_at&order=name"
  );
  return rows ?? [];
}

/** One person, by the name they sign in with. */
export async function findStaff(
  name: string
): Promise<(StaffMember & { secret_hash: string }) | undefined> {
  const rows = await rest<(StaffMember & { secret_hash: string })[]>(
    `staff?name=eq.${encodeURIComponent(name)}&select=*&limit=1`
  );
  return rows?.[0];
}

/** One person, by id. */
export async function getStaff(
  id: string
): Promise<(StaffMember & { secret_hash: string }) | undefined> {
  const rows = await rest<(StaffMember & { secret_hash: string })[]>(
    `staff?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows?.[0];
}

/**
 * Add a person and make their code.
 *
 * The code is returned once, here, and never again. There is no way to read
 * it back out of the table, which is the same as a password reset that only
 * works if you have the mail.
 */
export async function addStaff(
  name: string,
  email?: string
): Promise<{ member: StaffMember; code: string }> {
  const code = generateCode();
  const id = `st_${randomUUID().slice(0, 8)}`;

  const rows = await rest<StaffMember[]>(
    "staff?select=id,name,email,active,created_at,last_seen_at",
    {
      method: "POST",
      body: {
        id,
        name,
        email: email?.trim() || null,
        secret_hash: hashSecret(code),
        active: true,
      },
      prefer: "return=representation",
    }
  );

  return { member: rows[0], code };
}

/** Let someone back in without making them a new person. */
export async function setStaffActive(
  id: string,
  active: boolean
): Promise<void> {
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { active },
  });
}

/** Take someone off the list. Their marks stay where they are. */
export async function removeStaff(id: string): Promise<void> {
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Note that someone was here. */
export async function touchStaff(id: string): Promise<void> {
  await rest(`staff?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { last_seen_at: new Date().toISOString() },
  });
}
