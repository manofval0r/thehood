/**
 * The kinds of thing a reader can be told about.
 *
 * This file has no secrets and no database in it, so the browser can read it
 * too. The names live here because a category nobody can name is a category
 * nobody will turn on.
 */

export type NotificationKind =
  | "material"
  | "classes"
  | "attendance"
  | "calendar"
  | "staff"
  | "system";

export const KINDS: NotificationKind[] = [
  "material",
  "classes",
  "attendance",
  "calendar",
  "staff",
  "system",
];

export const KIND_LABEL: Record<NotificationKind, string> = {
  material: "New course material",
  classes: "Your classes",
  attendance: "Your attendance",
  calendar: "The academic calendar",
  staff: "Staff",
  system: "The site itself",
};

export const KIND_HELP: Record<NotificationKind, string> = {
  material: "When a lecture deck or a handout is posted for a course you take.",
  classes: "Before a class starts, and when it ends.",
  attendance: "When attendance for a class is recorded, or a mark is changed.",
  calendar: "Exams, registration and the rest of the calendar.",
  staff: "Approvals, unmarked classes, and changes to the courses you teach.",
  system: "When something the site depends on breaks.",
};
