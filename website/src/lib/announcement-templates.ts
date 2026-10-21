/**
 * The shapes of message a super admin sends.
 *
 * A super admin sends the same handful of things over and over: a class is
 * cancelled, a class is in a different room, a class starts at a different
 * time, the material is up, the exam has moved. Writing those from scratch
 * every time is how a room number gets left out of a room change.
 *
 * So there are shapes for them, and the shape fills itself in. The person
 * who is sending can change every word afterwards, because sometimes the
 * situation is not one of the usual ones.
 *
 * This file has no secrets and no database in it, so the browser can read it
 * too, and the preview on the page is made of the same code that makes the
 * message.
 */

import type { NotificationKind } from "@/lib/notification-kinds";
import { COURSES } from "@/lib/resources";

export type AnnouncementTemplate =
  | "cancelled"
  | "room"
  | "time"
  | "material"
  | "exam"
  | "message";

export interface TemplateDefinition {
  id: AnnouncementTemplate;
  /** What it is called on the button. */
  label: string;
  /** One line saying when to use it. */
  help: string;
  /** The kind of notification it counts as. */
  kind: NotificationKind;
  /** Whether it wants a time of day, a room, or nothing. */
  detail: "none" | "room" | "time";
  /** Whether the course has to be chosen. */
  needsCourse: boolean;
  /** Whether it is urgent by default. */
  urgentByDefault: boolean;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "cancelled",
    label: "Class cancelled",
    help: "The class does not run. Say when the next one is.",
    kind: "classes",
    detail: "none",
    needsCourse: true,
    urgentByDefault: true,
  },
  {
    id: "room",
    label: "Different room",
    help: "The class runs, but not where it usually does.",
    kind: "classes",
    detail: "room",
    needsCourse: true,
    urgentByDefault: false,
  },
  {
    id: "time",
    label: "Different time",
    help: "The class runs, but at another time.",
    kind: "classes",
    detail: "time",
    needsCourse: true,
    urgentByDefault: false,
  },
  {
    id: "material",
    label: "Material is up",
    help: "The slides and notes for a class are on the course page.",
    kind: "material",
    detail: "none",
    needsCourse: true,
    urgentByDefault: false,
  },
  {
    id: "exam",
    label: "Exam changed",
    help: "Something about an exam has changed.",
    kind: "calendar",
    detail: "none",
    needsCourse: true,
    urgentByDefault: true,
  },
  {
    id: "message",
    label: "Something else",
    help: "Any message at all.",
    kind: "system",
    detail: "none",
    needsCourse: false,
    urgentByDefault: false,
  },
];

export const TEMPLATE_BY_ID: Record<AnnouncementTemplate, TemplateDefinition> =
  Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<
    AnnouncementTemplate,
    TemplateDefinition
  >;

/**
 * What the composer knows about the class a message is about.
 *
 * The times and the rooms come from the timetable, so a message about a
 * class cannot say the wrong time: there is one timetable and this reads
 * it. It is the class that has not happened yet, because a class that
 * finished an hour ago cannot be cancelled.
 */
export interface ClassContext {
  /** The course code, "CYB 305". */
  course: string;
  /** The course title. */
  title: string;
  /** "today", or "on Friday 23 October". Empty when there is no class left. */
  when: string;
  /** "12:30pm to 2:30pm", or empty. */
  time: string;
  /** "the Cybersecurity Lab", or empty. */
  venue: string;
  /** "The next class is on Monday at 9:00am.", or empty. */
  next: string;
  /** Whether the next class is today. */
  today: boolean;
}

/** The text a shape makes. */
export interface Draft {
  title: string;
  body: string;
  href: string;
}

/**
 * Fill a shape in.
 *
 * The room and the time are the extra detail, so the shape can say where
 * the class has moved to and when it has moved to.
 */
export function fillTemplate(
  template: AnnouncementTemplate,
  context: ClassContext | null,
  detail: string
): Draft {
  const course = context?.course ?? "";
  const when = context?.when ?? "today";
  const time = context?.time ?? "";
  const theClass = time ? `the ${time} class` : "the class";
  const next = context?.next ?? "";
  const detailText = detail.trim();

  switch (template) {
    case "cancelled":
      return {
        title: course
          ? `${course} is cancelled ${when}`
          : `A class is cancelled ${when}`,
        body: next
          ? `${theClass[0].toUpperCase()}${theClass.slice(1)} does not run. ${next}`
          : `${theClass[0].toUpperCase()}${theClass.slice(1)} does not run.`,
        href: "/timetable",
      };

    case "room":
      return {
        title: course
          ? `${course} is in a different room ${when}`
          : `A class is in a different room ${when}`,
        body: detailText
          ? `${cap(theClass)} is in ${detailText}, not in ${context?.venue || "where it usually is"}.`
          : `${cap(theClass)} is in a different room.`,
        href: "/timetable",
      };

    case "time":
      return {
        title: course
          ? `${course} is at a different time ${when}`
          : `A class is at a different time ${when}`,
        body: detailText
          ? `${cap(theClass)} now runs at ${detailText}.`
          : `${cap(theClass)} runs at a different time.`,
        href: "/timetable",
      };

    case "material":
      return {
        title: course
          ? `The material for ${course} is up`
          : "New material is up",
        body: time
          ? `The slides and notes for ${theClass} are on the course page.`
          : "The slides and notes are on the course page.",
        href: course ? `/courses/${courseSlugOf(course)}` : "/courses",
      };

    case "exam":
      return {
        title: course
          ? `Something has changed about the ${course} exam`
          : "Something has changed about an exam",
        body: detailText || "There is more on the course page.",
        href: "/timeline",
      };

    case "message":
    default:
      return {
        title: "A message from the department",
        body: detailText || "There is more on the site.",
        href: "/",
      };
  }
}

/** A sentence's first letter, capitalised. */
function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The slug of a course code.
 *
 * The course list is a constant in the bundle, so the slug is worked out
 * from it rather than asked for. A second list of slugs would drift from
 * the first one, and a link to a course that has moved is a broken link in
 * a message about a class not running.
 */
function courseSlugOf(code: string): string {
  return COURSES.find((c) => c.code === code)?.slug ?? "";
}
