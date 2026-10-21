/**
 * Whether a competition is one a student here can enter.
 *
 * A competition is either online or it is in a room. A room can be in
 * Nigeria, in which case a student can travel to it, or it can be in
 * another country, in which case a list of them is a list of things they
 * cannot do.
 *
 * The feed says whether people have to be there in person, and it says
 * where. The location is a free string, so it is matched loosely: "Lagos,
 * Nigeria" and "Nigeria" both count, and so does "Abuja".
 *
 * This file is separate from the feed itself because the feed is read on the
 * server and this is read in the browser, and a file that is read in both
 * cannot hold a cached function.
 */

export interface CompetitionPlace {
  /** Whether people have to be there in person. */
  onsite: boolean;
  /** Where it happens. A city and a country, or "Online", or empty. */
  location: string;
}

const NIGERIA = [
  "nigeria",
  "lagos",
  "abuja",
  "benin city",
  "kano",
  "ibadan",
  "port harcourt",
  "enugu",
  "owerri",
  "jos",
  "nwele",
  "umunze",
  "yola",
  "asaba",
];

const ONLINE = ["online", "on-line", "remote", "virtual", "internet"];

/** Whether it can be entered without being in the room. */
export function isRemote(event: CompetitionPlace): boolean {
  if (!event.onsite) return true;
  return ONLINE.some((word) => event.location.toLowerCase().includes(word));
}

/** Whether it is happening in Nigeria. */
export function isInNigeria(event: CompetitionPlace): boolean {
  const where = event.location.toLowerCase();
  return NIGERIA.some((word) => where.includes(word));
}

/** Whether a student in Nigeria can enter it. */
export function isJoinable(event: CompetitionPlace): boolean {
  return isRemote(event) || isInNigeria(event);
}
