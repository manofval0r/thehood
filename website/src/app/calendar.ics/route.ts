import { ACADEMIC_CALENDAR_EVENTS } from "@/lib/calendar";
import { buildCalendar } from "@/lib/ics";

/**
 * The academic calendar as a downloadable iCalendar file.
 *
 * Served from a route rather than a file in public/ so the event set can never
 * drift from src/lib/calendar.ts, which is the single source of truth.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { text, added } = buildCalendar(ACADEMIC_CALENDAR_EVENTS, origin);

  return new Response(text, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nutm-academic-calendar-2026-2027.ics"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Event-Count": String(added),
    },
  });
}
