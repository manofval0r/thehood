export type BulletinSource =
  | "admin"
  | "outlook"
  | "timetable"
  | "academic_calendar"
  | "assessment"
  | "resource";

export type BulletinKind =
  | "class"
  | "alert"
  | "notice"
  | "event"
  | "deadline"
  | "resource";

export type BulletinStatus =
  | "draft"
  | "published"
  | "cancelled"
  | "archived";

export type RsvpResponse = "going" | "unsure" | "not_going";

/** The public shape. Meeting URLs never belong in this type. */
export interface BulletinItem {
  id: string;
  title: string;
  body: string;
  kind: BulletinKind;
  source: BulletinSource;
  status: BulletinStatus;
  course: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  hasMeeting: boolean;
  pinned: boolean;
  urgent: boolean;
  rsvpEnabled: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  sourceUpdatedAt: string | null;
  sourceLabel: string;
  canonicalHref: string;
  rsvp?: RsvpSummary;
}

export interface RsvpSummary {
  going: number;
  unsure: number;
  notGoing: number;
  total: number;
  mine?: RsvpResponse | null;
}

export interface OutlookEvent {
  id: string;
  externalId: string;
  subject: string;
  bodyPreview: string;
  course: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  joinUrl: string | null;
  webUrl: string | null;
  isCancelled: boolean;
  sourceUpdatedAt: string;
}

export interface OverrideSnapshot {
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  meetingUrl: string | null;
  sourceUpdatedAt?: string | null;
}

export interface OverrideProposal extends OverrideSnapshot {
  note: string | null;
}

export interface ClassOccurrenceOverride {
  id: string;
  occurrenceKey: string;
  sourceEventId: string | null;
  course: string;
  action: "cancel" | "change";
  status: "active" | "restored";
  original: OverrideSnapshot;
  proposed: OverrideProposal;
  reason: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  restoredAt: string | null;
}

export interface EffectiveClassOccurrence {
  id: string;
  externalId: string;
  title: string;
  body: string;
  course: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  meetingUrl: string | null;
  webUrl: string | null;
  status: "scheduled" | "cancelled";
  effectiveSource: "outlook" | "override";
  sourceUpdatedAt: string;
  note: string | null;
  reason: string | null;
  overrideId: string | null;
}
