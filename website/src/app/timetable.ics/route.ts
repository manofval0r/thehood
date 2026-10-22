import { buildLectureCalendar } from "@/lib/ics";
import { upcomingLectures } from "@/lib/lectures";
import { getAllBreaks } from "@/lib/break-store";

/**
 * The lectures as a downloadable iCalendar file.
 *
 * Served from a route rather than a file in public/ so the event set can
 * never drift from src/lib/schedule.ts and the academic calendar, which
 * are the two things it is made of.
 *
 * Only the lectures that are still to come are written. A calendar with
 * two hundred events in the past is a calendar nobody can read, and the
 * weeks before today are on the timetable page anyway.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const breaks = await getAllBreaks();
  const lectures = upcomingLectures(breaks);
  const { text, added } = buildLectureCalendar(lectures, origin);

  return new Response(text, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="cybersecurity-300l-lectures.ics"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Event-Count": String(added),
    },
  });
}
