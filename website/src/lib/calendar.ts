// Parsed from docs/NUTM_2026-2027_Unified_Academic_Calendar.md
// Source: Office of the Registrar, Nigerian University of Technology and Management, Apapa, Lagos
export type Category =
  | "Academic"
  | "Exams & Results"
  | "Holidays & Breaks"
  | "Statutory Meetings"
  | "Ceremonies";

export interface CalendarEvent {
  month: string;
  date: string;
  day: string;
  activity: string;
  category: Category;
  /** Resolved start/end where the row is a single day or a span. */
  start: Date | null;
  end: Date | null;
}

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

/** "October 17 - October 18, 2026" | "October 5, 2026" | "All month" | "TBD" */
function parseDate(date: string, month: string): { start: Date | null; end: Date | null } {
  if (!/\d/.test(date) || /^tbd$/i.test(date.trim())) return { start: null, end: null };
  if (/all month/i.test(date)) return { start: null, end: null };

  const yrMatch = date.match(/(\d{4})/);
  if (!yrMatch) return { start: null, end: null };
  const year = Number(yrMatch[1]);

  // Split on an en dash / hyphen between two month names.
  const spanMatch = date.match(
    /([A-Z][a-z]+)\s+(\d{1,2})\s*[-\u2013]\s*(?:[A-Z][a-z]+\s+)?(\d{1,2}),\s*(\d{4})/
  );
  if (spanMatch) {
    const m1 = MONTHS[spanMatch[1]];
    const d1 = Number(spanMatch[2]);
    const d2 = Number(spanMatch[3]);
    const y2 = Number(spanMatch[4]);
    if (m1 !== undefined) {
      return { start: new Date(y2, m1, d1), end: new Date(y2, m1, d2) };
    }
  }

  const single = date.match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (single) {
    const m = MONTHS[single[1]];
    const d = Number(single[2]);
    const y = Number(single[3]);
    if (m !== undefined) {
      const dt = new Date(y, m, d);
      return { start: dt, end: dt };
    }
  }
  return { start: null, end: null };
}

type RawEvent = Omit<CalendarEvent, "start" | "end">;

const RAW: RawEvent[] = [
  { month: "September 2026", date: "September 28, 2026", day: "Monday", activity: "Staff Training for New Session", category: "Statutory Meetings" },
  { month: "October 2026", date: "October 1, 2026", day: "Thursday", activity: "Independence Day Public Holiday", category: "Holidays & Breaks" },
  { month: "October 2026", date: "October 4, 2026", day: "Sunday", activity: "Resumption of Returning/Direct Entry UG Students", category: "Academic" },
  { month: "October 2026", date: "October 5, 2026", day: "Monday", activity: "Registration of Returning/Direct Entry UG Students", category: "Academic" },
  { month: "October 2026", date: "October 5, 2026", day: "Monday", activity: "Resumption of Full-Time PG Students", category: "Academic" },
  { month: "October 2026", date: "October 6 - October 7, 2026", day: "Tuesday", activity: "Registration Exercise for Full-Time PG Students", category: "Academic" },
  { month: "October 2026", date: "October 7, 2026", day: "Wednesday", activity: "Commencement of UG Lectures (Returning/Direct Entry)", category: "Academic" },
  { month: "October 2026", date: "October 8, 2026", day: "Thursday", activity: "Full-Time PG Orientation I", category: "Academic" },
  { month: "October 2026", date: "October 9, 2026", day: "Friday", activity: "Resumption & Combined Orientation Full/Part-Time PG Students", category: "Academic" },
  { month: "October 2026", date: "October 12, 2026", day: "Monday", activity: "Commencement of Full-Time PG Lectures", category: "Academic" },
  { month: "October 2026", date: "October 15, 2026", day: "Thursday", activity: "Senate Statutory Meeting", category: "Statutory Meetings" },
  { month: "October 2026", date: "October 16, 2026", day: "Friday", activity: "Commencement of Part-Time PG Lectures", category: "Academic" },
  { month: "October 2026", date: "October 17 - October 18, 2026", day: "Saturday", activity: "Arrival of New UG Students", category: "Academic" },
  { month: "October 2026", date: "October 19 - October 21, 2026", day: "Monday", activity: "Registration & Orientation of New UG Students", category: "Academic" },
  { month: "October 2026", date: "October 22, 2026", day: "Thursday", activity: "Commencement of Lectures for New UG Students", category: "Academic" },
  { month: "November 2026", date: "November 19, 2026", day: "Thursday", activity: "Senate Statutory Meeting", category: "Statutory Meetings" },
  { month: "November 2026", date: "November 27, 2026", day: "Friday", activity: "Congregation Meeting", category: "Statutory Meetings" },
  { month: "December 2026", date: "December 1, 2026", day: "Tuesday", activity: "Council Meeting", category: "Statutory Meetings" },
  { month: "December 2026", date: "December 5, 2026", day: "Saturday", activity: "Matriculation Ceremony", category: "Ceremonies" },
  { month: "December 2026", date: "December 17, 2026", day: "Thursday", activity: "Senate Statutory Meeting", category: "Statutory Meetings" },
  { month: "December 2026", date: "December 18, 2026", day: "Friday", activity: "End of Lectures for the Year (Week 11)", category: "Academic" },
  { month: "December 2026", date: "TBD", day: "TBD", activity: "MBA Convocation", category: "Ceremonies" },
  { month: "December 2026", date: "December 19 - January 8, 2027", day: "Saturday", activity: "Christmas / New Year Break", category: "Holidays & Breaks" },
  { month: "January 2027", date: "January 10, 2027", day: "Sunday", activity: "All Students Return", category: "Academic" },
  { month: "January 2027", date: "January 11, 2027", day: "Monday", activity: "Lectures Resume (Week 12)", category: "Academic" },
  { month: "January 2027", date: "January 14, 2027", day: "Thursday", activity: "Senate Statutory Meeting", category: "Statutory Meetings" },
  { month: "January 2027", date: "January 16, 2027", day: "Saturday", activity: "General Election", category: "Holidays & Breaks" },
  { month: "February 2027", date: "February 1 - February 5, 2027", day: "Monday", activity: "UG and PG Lectures Continue", category: "Academic" },
  { month: "February 2027", date: "February 8 - February 19, 2027", day: "Monday", activity: "Lecture-Free / Revision Week", category: "Exams & Results" },
  { month: "February 2027", date: "February 21, 2027", day: "Sunday", activity: "First Semester Examinations (UG & PG)", category: "Exams & Results" },
  { month: "February 2027", date: "February 22 - March 5, 2027", day: "Monday", activity: "Students Vacate Campus", category: "Academic" },
  { month: "February 2027", date: "February 22 - March 5, 2027", day: "Monday", activity: "First Semester Break & Marking Period", category: "Exams & Results" },
  { month: "March 2027", date: "March 6 - March 7, 2027", day: "Saturday", activity: "Students Return to Campus", category: "Academic" },
  { month: "March 2027", date: "March 8, 2027", day: "Monday", activity: "Commencement of Second Semester Lectures", category: "Academic" },
  { month: "March 2027", date: "March 8, 2027", day: "Monday", activity: "Faculty Board Meeting", category: "Statutory Meetings" },
  { month: "March 2027", date: "March 9, 2027", day: "Tuesday", activity: "Eid al-Fitr Holiday", category: "Holidays & Breaks" },
  { month: "March 2027", date: "March 18, 2027", day: "Thursday", activity: "Senate Meeting (Results Ratification)", category: "Statutory Meetings" },
  { month: "March 2027", date: "March 25, 2027", day: "Thursday", activity: "Release of First Semester Results", category: "Exams & Results" },
  { month: "March 2027", date: "March 26, 2027", day: "Friday", activity: "Good Friday", category: "Holidays & Breaks" },
  { month: "March 2027", date: "March 28, 2027", day: "Sunday", activity: "Easter Sunday", category: "Holidays & Breaks" },
  { month: "March 2027", date: "March 29, 2027", day: "Monday", activity: "Easter Monday", category: "Holidays & Breaks" },
  { month: "April 2027", date: "All month", day: "All month", activity: "UG and PG Second Semester Lectures Continue", category: "Academic" },
  { month: "May 2027", date: "May 3, 2027", day: "Monday", activity: "Workers Day Holiday (Observed)", category: "Holidays & Breaks" },
  { month: "May 2027", date: "May 17, 2027", day: "Monday", activity: "Eid al-Adha Holiday", category: "Holidays & Breaks" },
  { month: "May 2027", date: "May 20, 2027", day: "Thursday", activity: "Senate Statutory Meeting", category: "Statutory Meetings" },
  { month: "May 2027", date: "All month", day: "All month", activity: "UG and PG Lectures Continue", category: "Academic" },
  { month: "June 2027", date: "June 7 - June 11, 2027", day: "Monday", activity: "Lecture-Free / Revision Week", category: "Exams & Results" },
  { month: "June 2027", date: "June 14, 2027", day: "Monday", activity: "Democracy Day Holiday (Observed)", category: "Holidays & Breaks" },
  { month: "June 2027", date: "June 15 - June 25, 2027", day: "Tuesday", activity: "Second Semester Examinations (UG & PG)", category: "Exams & Results" },
  { month: "June 2027", date: "June 26, 2027", day: "Sunday", activity: "Students Vacate Campus", category: "Academic" },
  { month: "July 2027", date: "July 12, 2027", day: "Monday", activity: "Faculty Board Meeting for Result Consideration", category: "Statutory Meetings" },
  { month: "July 2027", date: "July 15, 2027", day: "Thursday", activity: "Senate Meeting (Result Ratification)", category: "Statutory Meetings" },
  { month: "July 2027", date: "July 23, 2027", day: "Friday", activity: "Uploading of Results", category: "Exams & Results" },
  { month: "July 2027", date: "July 23, 2027", day: "Friday", activity: "End of Academic Session", category: "Academic" },
];

export const ACADEMIC_CALENDAR_EVENTS: CalendarEvent[] = RAW.map((e) => ({
  ...e,
  ...parseDate(e.date, e.month),
}));

export const CATEGORY_STYLE: Record<
  Category,
  { text: string; dot: string; chip: string; border: string }
> = {
  Academic: {
    text: "text-tone-academic",
    dot: "bg-tone-academic",
    chip: "bg-tone-academic/10 text-tone-academic",
    border: "border-tone-academic/30",
  },
  "Exams & Results": {
    text: "text-tone-exams",
    dot: "bg-tone-exams",
    chip: "bg-tone-exams/10 text-tone-exams",
    border: "border-tone-exams/30",
  },
  "Holidays & Breaks": {
    text: "text-tone-holiday",
    dot: "bg-tone-holiday",
    chip: "bg-tone-holiday/10 text-tone-holiday",
    border: "border-tone-holiday/30",
  },
  "Statutory Meetings": {
    text: "text-tone-statutory",
    dot: "bg-tone-statutory",
    chip: "bg-tone-statutory/10 text-tone-statutory",
    border: "border-tone-statutory/30",
  },
  Ceremonies: {
    text: "text-tone-ceremony",
    dot: "bg-tone-ceremony",
    chip: "bg-tone-ceremony/10 text-tone-ceremony",
    border: "border-tone-ceremony/30",
  },
};

export const SESSION_ANCHORS = {
  sessionStart: new Date(2026, 9, 7), // UG lectures begin
  examStart: new Date(2027, 1, 21),   // First-semester exams begin
  semester2Start: new Date(2027, 2, 8),
  exam2Start: new Date(2027, 5, 15),  // Second-semester exams begin
  sessionEnd: new Date(2027, 6, 23),
};

const MS_PER_DAY = 86_400_000;

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export interface SessionStats {
  daysInSession: number;
  daysUntilExams: number;
  daysUntilEnd: number;
  weeksIn: number;
  totalDays: number;
  progress: number;
  /** Which stretch of the calendar "today" falls in. */
  phase: string;
  nextMilestone: CalendarEvent | null;
}

export function sessionStats(now: Date): SessionStats {
  const { sessionStart, examStart, sessionEnd } = SESSION_ANCHORS;
  const totalDays = daysBetween(sessionStart, sessionEnd);
  const daysInSession = daysBetween(sessionStart, now);
  const daysUntilExams = daysBetween(now, examStart);
  const daysUntilEnd = daysBetween(now, sessionEnd);

  let phase = "First semester lectures";
  if (now < sessionStart) phase = "Before lectures begin";
  else if (now < new Date(2026, 11, 18)) phase = "First semester lectures";
  else if (now < new Date(2027, 0, 11)) phase = "Christmas break";
  else if (now < new Date(2027, 1, 8)) phase = "Second half of first semester";
  else if (now < examStart) phase = "Revision week";
  else if (now < new Date(2027, 2, 8)) phase = "First semester examinations";
  else if (now < new Date(2027, 5, 15)) phase = "Second semester lectures";
  else if (now < new Date(2027, 6, 23)) phase = "Second semester examinations";
  else phase = "Session complete";

  // The next dated event that hasn't happened yet.
  const nextMilestone =
    ACADEMIC_CALENDAR_EVENTS.find((e) => e.start && e.start.getTime() >= now.getTime()) ??
    null;

  return {
    daysInSession: Math.max(0, daysInSession),
    daysUntilExams: daysUntilExams,
    daysUntilEnd: Math.max(0, daysUntilEnd),
    weeksIn: Math.max(0, Math.floor(daysInSession / 7)),
    totalDays,
    progress: Math.min(Math.max(daysInSession / totalDays, 0), 1),
    phase,
    nextMilestone,
  };
}

export function isPast(e: CalendarEvent, now: Date) {
  if (!e.end) return false;
  return e.end.getTime() < now.getTime();
}

export function isToday(e: CalendarEvent, now: Date) {
  if (!e.start) return false;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return e.start.getTime() === d.getTime();
}