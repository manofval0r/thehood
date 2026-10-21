import { cacheLife } from "next/cache";
import { ACADEMIC_CALENDAR_EVENTS } from "@/lib/calendar";

/**
 * The events feed.
 *
 * Two live sources and one standing one:
 *
 *   1. CTFtime, for the capture-the-flag competitions a student can enter.
 *      Fetched on the server and cached, so the reader's browser never talks
 *      to CTFtime and no tracker there learns that anybody was reading.
 *   2. The department's own academic calendar, which is already in the
 *      manifest.
 *   3. The events that happen every year, which no feed reports because they
 *      are not announcements, they are the shape of the year.
 *
 * CTFtime asks that their API be used for data analysis and not for building
 * a clone of their site. This is a short list with a link back to the event,
 * cached for an hour, and it says where it came from.
 */

export interface CtfEvent {
  id: string;
  title: string;
  /** Epoch milliseconds. */
  start: number;
  end: number;
  /** The event page on CTFtime. */
  url: string;
  organizer: string;
  /** Jeopardy, Attack-Defense, and so on. */
  format: string;
  /** Whether people have to be there in person. */
  onsite: boolean;
  /** Where it happens. A city and a country, or "Online", or empty. */
  location: string;
  /** Open, Individual, Prequalified, and so on. */
  restrictions: string;
  /** How heavily the event is weighted in the CTFtime rating. */
  weight: number;
  /** Plain text. The feed sends HTML. */
  description: string;
  /** How long it runs for, in hours. */
  hours: number;
}

const CTFTIME_ENDPOINT = "https://ctftime.org/api/v1/events/";

/** Strips the HTML the feed sends and collapses the whitespace. */
function toPlainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEvent(raw: Record<string, unknown>): CtfEvent | null {
  const id = String(raw.id ?? "");
  const title = toPlainText(raw.title);
  const start = Date.parse(String(raw.start ?? ""));
  if (!id || !title || !Number.isFinite(start)) return null;

  const organizers = Array.isArray(raw.organizers) ? raw.organizers : [];
  const organizer = organizers
    .map((o) => toPlainText((o as Record<string, unknown>)?.name))
    .filter(Boolean)
    .join(", ");

  const finish = Date.parse(String(raw.finish ?? ""));
  const duration = raw.duration as { days?: number; hours?: number } | undefined;
  const end = Number.isFinite(finish)
    ? finish
    : start +
      ((duration?.days ?? 0) * 24 + (duration?.hours ?? 0)) * 60 * 60 * 1000;

  return {
    id,
    title,
    start,
    end,
    url: toPlainText(raw.ctftime_url),
    organizer,
    format: toPlainText(raw.format) || "Jeopardy",
    onsite: String(raw.onsite ?? "") === "true",
    location: toPlainText(raw.location),
    restrictions: toPlainText(raw.restrictions) || "Open",
    weight: Number(raw.weight ?? 0),
    description: toPlainText(raw.description).slice(0, 600),
    hours: Math.round(((end - start) / 3600000) * 10) / 10,
  };
}

/**
 * Whether a competition can be entered from a desk in Lagos.
 *
 * The feed says whether people have to be there in person, and most of them
 * say no. Some say where, and some of those say a city in another country.
 */
export function isRemote(event: CtfEvent): boolean {
  if (!event.onsite) return true;
  return /online|on-line|remote|virtual|internet/i.test(event.location);
}

/** Whether a competition is happening in Nigeria. */
export function isInNigeria(event: CtfEvent): boolean {
  return /nigeria|lagos|abuja|benin city|kano|ibadan|port harcourt|enugu|owerri|jos\b|nwele/i.test(
    event.location
  );
}

/**
 * Whether a competition is one a student here can actually join.
 *
 * A competition in another country that needs you in the room is not one a
 * student in Nigeria can enter. One that is online, or one that is in
 * Nigeria, is.
 */
export function isJoinable(event: CtfEvent): boolean {
  return isRemote(event) || isInNigeria(event);
}

/**
 * The next capture-the-flag competitions.
 *
 * A dead feed must not take the page down with it, so a failure returns an
 * empty list and the page says the feed is unreachable rather than showing
 * an error.
 */
export async function getCtfEvents(limit = 24): Promise<CtfEvent[]> {
  "use cache";
  cacheLife("hours");

  try {
    const res = await fetch(`${CTFTIME_ENDPOINT}?limit=${limit}`, {
      headers: { "User-Agent": "thehood-cyber300 (course resources site)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];

    const body = await res.json();
    if (!Array.isArray(body)) return [];

    return body
      .map((raw: Record<string, unknown>) => parseEvent(raw))
      .filter((e): e is CtfEvent => e !== null)
      .sort((a, b) => a.start - b.start);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------- the department */

export interface DepartmentEvent {
  title: string;
  category: string;
  /** What the category means, so a line on a calendar explains itself. */
  note: string;
  /** yyyy-mm-dd */
  date: string;
  /** Human date, e.g. "Monday 3 November 2026". */
  when: string;
}

/**
 * What each kind of entry on the academic calendar means.
 *
 * "Statutory Meetings" on a calendar tells a student nothing on its own. The
 * date tells them when to be somewhere; the note tells them why it is
 * worth being there.
 */
const CATEGORY_NOTES: Record<string, string> = {
  Academic:
    "The teaching weeks of the session: when registration opens, when people come back, and when the lectures run.",
  "Statutory Meetings":
    "The dates the university has fixed for its own meetings. These are the ones the calendar moves around when they move.",
  "Exams & Results":
    "When the examinations are and when the results come out.",
  "Holidays & Breaks":
    "The public holidays and the breaks between them. These are the days nobody is expected in a classroom.",
  Ceremonies:
    "The ceremonies of the session, which are the days the department is in one place.",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The department's own calendar, from today onwards. */
export async function getDepartmentEvents(): Promise<DepartmentEvent[]> {
  "use cache";
  cacheLife("hours");

  // The clock is read inside the cached scope on purpose. Passing "now" in as
  // an argument would put it in the cache key, and the key would then be
  // different on every call, so the cache would never be hit.
  const from = Date.now();

  return ACADEMIC_CALENDAR_EVENTS.filter((e) => {
    if (!e.start) return false;
    return e.start.getTime() >= from;
  })
    .slice(0, 12)
    .map((e) => {
      const d = e.start as Date;
      return {
        title: e.activity,
        category: e.category,
        note:
          CATEGORY_NOTES[e.category] ??
          "A date on the published academic calendar.",
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        when: `${e.day} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      };
    });
}

/* ---------------------------------------------------------- every year */

export interface AnnualEvent {
  name: string;
  when: string;
  what: string;
  /** Where the details live. */
  href: string;
}

/**
 * The events that happen every year.
 *
 * These are not announcements, so no feed reports them. They are the shape of
 * the year, and knowing they exist is the difference between planning for
 * them and hearing about them afterwards.
 */
export const ANNUAL_EVENTS: AnnualEvent[] = [
  {
    name: "Cyber Security Awareness Month",
    when: "Every October",
    what: "Nigeria's national cybersecurity awareness month. The month when federal bodies, banks and telcos run public campaigns, and when security recruitment drives are at their loudest. It is the one event on this list that happens around you.",
    href: "https://www.nitda.gov.ng",
  },
  {
    name: "OWASP AppSec",
    when: "Through the year, with a global and several regional editions",
    what: "The application security conference. The AppSec days are cheap or free, and the talks end up on OWASP's own channels afterwards. The closest thing here to a conference that assumes you are a student.",
    href: "https://owasp.org/events/",
  },
  {
    name: "BSides",
    when: "Through the year, in many cities",
    what: "Community-run security conferences with a low ticket price and a beginner track. They are run by volunteers for the community, which is why the programme is generous to people who have never spoken at one.",
    href: "https://www.bsides.to/",
  },
  {
    name: "Black Hat",
    when: "Each August",
    what: "The large vendor-sponsored conference. Expensive to attend and worth following from the free material, because the talks about what is actually being exploited are the useful part.",
    href: "https://www.blackhat.com",
  },
  {
    name: "DEF CON",
    when: "Each August, alongside Black Hat",
    what: "The hacker convention next door to it. Cheap, unstructured, and where a lot of people meet the people they later work with. Village content is free and published after the event.",
    href: "https://defcon.org",
  },
];
