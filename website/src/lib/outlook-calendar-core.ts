import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { COURSES } from "@/lib/resources";
import type { OutlookEvent } from "@/lib/bulletin-types";

export interface GraphCalendarEvent {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  body?: { content?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  location?: { displayName?: string };
  onlineMeeting?: { joinUrl?: string };
  onlineMeetingUrl?: string;
  webLink?: string;
  isCancelled?: boolean;
  lastModifiedDateTime?: string;
}

function searchable(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function inferCourse(subject = "", bodyPreview = ""): string | null {
  const haystack = searchable(`${subject} ${bodyPreview}`);
  return (
    COURSES.find((course) => haystack.includes(searchable(course.code)))?.code ??
    null
  );
}

const MEETING_URL =
  /https:\/\/(?:[\w.-]*teams\.microsoft\.com\/l\/meetup-join|[\w.-]*zoom\.us\/j)\/[^^\s<>"']+/i;

function cleanUrl(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(MEETING_URL);
  return match?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

export function extractMeetingUrl(event: GraphCalendarEvent): string | null {
  return (
    cleanUrl(event.onlineMeeting?.joinUrl) ??
    cleanUrl(event.onlineMeetingUrl) ??
    cleanUrl(event.bodyPreview) ??
    cleanUrl(event.body?.content)
  );
}

function utcIso(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/(?<!Z|[+-]\d\d:\d\d)$/, "Z");
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function normalizeGraphEvent(
  event: GraphCalendarEvent
): OutlookEvent | null {
  const externalId = event.id?.trim();
  const startsAt = utcIso(event.start?.dateTime);
  const endsAt = utcIso(event.end?.dateTime);
  if (!externalId || !startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
    return null;
  }
  const bodyPreview = event.bodyPreview?.trim() ?? "";
  const subject = event.subject?.trim() || "Outlook event";
  return {
    id: `outlook:${externalId}`,
    externalId,
    subject,
    bodyPreview,
    course: inferCourse(subject, bodyPreview),
    startsAt,
    endsAt,
    location: event.location?.displayName?.trim() || null,
    joinUrl: extractMeetingUrl(event),
    webUrl: event.webLink?.trim() || null,
    isCancelled: Boolean(event.isCancelled),
    sourceUpdatedAt:
      utcIso(event.lastModifiedDateTime) ?? new Date(0).toISOString(),
  };
}

function encryptionKey(secret: string): Buffer {
  return createHash("sha256").update(`outlook-token:${secret}`).digest();
}

export function encryptOutlookToken(token: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptOutlookToken(
  encrypted: string,
  secret: string
): string | null {
  try {
    const [iv, tag, body] = encrypted
      .split(".")
      .map((part) => Buffer.from(part, "base64url"));
    if (!iv || !tag || !body) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(secret),
      iv
    );
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}

export interface OutlookState {
  staffId: string;
  expiresAt: number;
}

function stateSignature(payload: string, secret: string): string {
  return createHmac("sha256", `outlook-oauth:${secret}`)
    .update(payload)
    .digest("base64url");
}

export function createOutlookState(
  state: OutlookState,
  secret: string
): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString(
    "base64url"
  );
  return `${payload}.${stateSignature(payload, secret)}`;
}

export function readOutlookState(
  value: string,
  secret: string,
  now = Date.now()
): OutlookState | null {
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = value.slice(0, separator);
  const supplied = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(stateSignature(payload, secret));
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<OutlookState>;
    if (
      typeof parsed.staffId !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now
    ) {
      return null;
    }
    return { staffId: parsed.staffId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}
