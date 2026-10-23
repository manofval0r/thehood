import type { NotificationKind } from "@/lib/notification-kinds";
import { COURSES } from "@/lib/resources";

/**
 * Every notification this site can send.
 *
 * The list is in one place so that a super admin can see the whole of it,
 * and so that the sample each one is tested with is written next to the
 * description of it. A notification nobody can name is a notification
 * nobody will turn on, and a notification nobody can test is a
 * notification nobody will trust.
 *
 * This file has no secrets and no database in it, so the browser can read
 * it too, and the page that lists them is made of the same code that
 * describes them.
 */

export type CatalogueId =
  | "class-soon"
  | "class-started"
  | "class-ended"
  | "break-soon"
  | "break-started"
  | "break-over"
  | "material"
  | "attendance"
  | "mark-changed"
  | "calendar"
  | "approval"
  | "unmarked"
  | "broken"
  | "announcement";

export interface CatalogueEntry {
  id: CatalogueId;
  /** What it is called. */
  title: string;
  /** The kind of notification it counts as. */
  kind: NotificationKind;
  /** When it happens, in one line. */
  when: string;
  /** What it is for, in one line. */
  what: string;
  /** Whether the site sends it on its own. */
  automatic: boolean;
}

/** A course to use in the samples, so they read like the real thing. */
const SAMPLE = COURSES.find((c) => c.code === "CYB 305") ?? COURSES[0];

export const CATALOGUE: CatalogueEntry[] = [
  {
    id: "class-soon",
    title: "A class starts in five minutes",
    kind: "classes",
    when: "Five minutes before every class on the timetable.",
    what: "So a reader is not caught out by the room changing.",
    automatic: true,
  },
  {
    id: "class-started",
    title: "A class has started",
    kind: "classes",
    when: "The moment a class on the timetable begins.",
    what: "So a reader who is running late knows the lecture has begun without opening the site.",
    automatic: true,
  },
  {
    id: "class-ended",
    title: "A class has just ended",
    kind: "classes",
    when: "The moment a class finishes.",
    what: "Because the material for it is up by then, and that is the moment somebody wants.",
    automatic: true,
  },
  {
    id: "break-soon",
    title: "A class has a break in five minutes",
    kind: "classes",
    when: "Five minutes before a break inside a lecture.",
    what: "So a reader knows the lecture is about to pause, and for how long.",
    automatic: true,
  },
  {
    id: "break-started",
    title: "A class is on a break",
    kind: "classes",
    when: "The moment a break inside a lecture begins.",
    what: "So a reader knows the teaching has paused and when it starts again.",
    automatic: true,
  },
  {
    id: "break-over",
    title: "A break is over",
    kind: "classes",
    when: "The moment a break inside a lecture ends.",
    what: "So a reader knows the teaching has started again.",
    automatic: true,
  },
  {
    id: "material",
    title: "New material for a course",
    kind: "material",
    when: "A lecture deck or a handout is uploaded.",
    what: "Because a student cares that a course has something new on it, and the panel says which.",
    automatic: true,
  },
  {
    id: "attendance",
    title: "Attendance recorded for a class",
    kind: "attendance",
    when: "The marks for a class are saved.",
    what: "So a student knows their mark is there before they ask.",
    automatic: true,
  },
  {
    id: "mark-changed",
    title: "A mark was changed",
    kind: "attendance",
    when: "Somebody corrects a mark.",
    what: "A correction somebody else made should not be something a student finds out from a friend.",
    automatic: true,
  },
  {
    id: "calendar",
    title: "Something in the academic calendar",
    kind: "calendar",
    when: "An exam, a registration or a holiday comes up.",
    what: "The dates are published, but a reminder is not the same as a date on a page.",
    automatic: true,
  },
  {
    id: "approval",
    title: "Somebody is waiting to be approved",
    kind: "staff",
    when: "An admin adds somebody to the staff list.",
    what: "The super admins are the only people who can let somebody in, so they are the only people who need to know.",
    automatic: true,
  },
  {
    id: "unmarked",
    title: "A class has not been marked",
    kind: "staff",
    when: "A class finishes and the marks for it are not in.",
    what: "An unmarked class is a class nobody will remember to mark.",
    automatic: true,
  },
  {
    id: "broken",
    title: "Something the site depends on has broken",
    kind: "system",
    when: "A feed that fails quietly is checked by the scheduler.",
    what: "The competitions feed fails silently by design, which is right for a reader and wrong for the person who runs the site.",
    automatic: true,
  },
  {
    id: "announcement",
    title: "A message from the department",
    kind: "classes",
    when: "A super admin writes one.",
    what: "The one everybody sends is that a class is not running. See Say something.",
    automatic: false,
  },
];

/**
 * The sample a test sends.
 *
 * It reads like the real thing, because a test that says "hello" tells the
 * person pressing the button nothing about whether the notification they
 * will get tomorrow looks like that.
 */
export function sampleFor(
  id: CatalogueId
): { title: string; body: string; href: string; course?: string } {
  const course = SAMPLE?.code;
  const title = SAMPLE?.title ?? "the course";
  const venue = SAMPLE?.venue ?? "the lab";

  switch (id) {
    case "class-soon":
      return {
        title: `${course} starts in five minutes`,
        body: `${title} · ${venue}`,
        href: "/timetable",
        course,
      };
    case "class-started":
      return {
        title: `${course} has started`,
        body: `${title} · ${venue}`,
        href: "/timetable",
        course,
      };
    case "class-ended":
      return {
        title: `${course} has just ended`,
        body: `${title}. The material for it should be on the course page.`,
        href: "/timetable",
        course,
      };
    case "break-soon":
      return {
        title: `${course} has a break in five minutes`,
        body: `The lecture pauses at 9:50am. The break is ten minutes long.`,
        href: "/timetable",
        course,
      };
    case "break-started":
      return {
        title: `${course} is on a break`,
        body: "The lecture pauses at 9:50am for ten minutes.",
        href: "/timetable",
        course,
      };
    case "break-over":
      return {
        title: `The break in ${course} is over`,
        body: `The lecture is teaching again. It runs until 12:00pm.`,
        href: "/timetable",
        course,
      };
    case "material":
      return {
        title: `New material for ${course}`,
        body: "Lecture 3 · Evidence and its chain of custody",
        href: "/courses",
        course,
      };
    case "attendance":
      return {
        title: `Attendance recorded for ${course}`,
        body: "Wednesday 21 October · by the lecturer",
        href: "/admin/attendance",
        course,
      };
    case "mark-changed":
      return {
        title: `A mark was changed for ${course}`,
        body: "Wednesday 21 October · by the lecturer",
        href: "/admin/attendance",
        course,
      };
    case "calendar":
      return {
        title: "First semester examinations begin",
        body: "The academic calendar · 27 October",
        href: "/timeline",
      };
    case "approval":
      return {
        title: "Somebody is waiting to be approved",
        body: "A new member of staff was added and cannot sign in yet.",
        href: "/admin",
      };
    case "unmarked":
      return {
        title: `${course} has an unmarked class`,
        body: "Wednesday 21 October",
        href: "/admin/attendance",
        course,
      };
    case "broken":
      return {
        title: "The competitions feed is not answering",
        body: "The rest of the site is fine. This is on the admin page, where somebody can see it.",
        href: "/admin",
      };
    case "announcement":
    default:
      return {
        title: `${course} is cancelled today`,
        body: "The 12:30pm to 2:30pm class does not run. The next class is on Wednesday 28 October at 12:30pm.",
        href: "/timetable",
        course,
      };
  }
}
