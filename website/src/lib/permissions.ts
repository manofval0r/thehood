/**
 * What a member of staff may do.
 *
 * This file has no secrets in it and no database in it, so both the server
 * and the browser can read it. The names of the permissions live here
 * because a permission you cannot name is a permission nobody will turn on.
 */

export type StaffRole = "super" | "admin";
export type StaffStatus = "pending" | "active" | "revoked" | "rejected";

/**
 * The things an admin can be allowed to do.
 *
 * Permissions are granted one at a time, because "revoke their access
 * entirely" and "revoke just the uploading" are different requests and
 * both are legitimate. A super admin has all of them whatever the list says.
 */
export const PERMISSIONS = ["attendance", "files", "roster", "staff"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABEL: Record<Permission, string> = {
  attendance: "Mark attendance",
  files: "Upload and remove course files",
  roster: "Keep the student roll",
  staff: "Add staff members",
};

export const PERMISSION_HELP: Record<Permission, string> = {
  attendance: "Fill the boxes on the attendance grid.",
  files: "Add and remove the files on a course page.",
  roster: "Add and remove students from the roll.",
  staff: "Add people, who then wait for a super admin to approve them.",
};

/** The minimum set somebody is given when they are first added. */
export const DEFAULT_PERMISSIONS: Permission[] = ["attendance"];

/** Whether a person may do a thing. */
export function can(
  staff: { role: StaffRole; permissions: Permission[] } | null,
  permission: Permission
): boolean {
  if (!staff) return false;
  if (staff.role === "super") return true;
  return staff.permissions.includes(permission);
}

/** Whether a person may approve, revoke and read the audit log. */
export function isSuper(staff: { role: StaffRole } | null): boolean {
  return staff?.role === "super";
}
