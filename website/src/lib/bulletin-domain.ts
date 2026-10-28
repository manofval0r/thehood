import type {
  BulletinItem,
  ClassOccurrenceOverride,
  EffectiveClassOccurrence,
  OutlookEvent,
  RsvpResponse,
  RsvpSummary,
} from "@/lib/bulletin-types";

function validInstant(value: string | null | undefined): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** Resolve one source event against the active one-occurrence override. */
export function effectiveOccurrence(
  source: OutlookEvent,
  override: ClassOccurrenceOverride | null
): EffectiveClassOccurrence | null {
  if (!validInstant(source.startsAt) || !validInstant(source.endsAt)) return null;
  if (Date.parse(source.endsAt) <= Date.parse(source.startsAt)) return null;

  const base: EffectiveClassOccurrence = {
    id: source.id,
    externalId: source.externalId,
    title: source.subject,
    body: source.bodyPreview,
    course: source.course,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
    location: source.location,
    meetingUrl: source.joinUrl,
    webUrl: source.webUrl,
    status: source.isCancelled ? "cancelled" : "scheduled",
    effectiveSource: "outlook",
    sourceUpdatedAt: source.sourceUpdatedAt,
    note: null,
    reason: null,
    overrideId: null,
  };

  if (!override || override.status !== "active") return base;

  if (override.action === "cancel") {
    return {
      ...base,
      status: "cancelled",
      meetingUrl: null,
      effectiveSource: "override",
      note: override.proposed.note,
      reason: override.reason,
      overrideId: override.id,
    };
  }

  const startsAt = override.proposed.startsAt ?? base.startsAt;
  const endsAt = override.proposed.endsAt ?? base.endsAt;
  if (!validInstant(startsAt) || !validInstant(endsAt)) return null;
  if (Date.parse(endsAt) <= Date.parse(startsAt)) return null;

  return {
    ...base,
    startsAt,
    endsAt,
    location: override.proposed.location ?? base.location,
    meetingUrl: override.proposed.meetingUrl ?? base.meetingUrl,
    status: "scheduled",
    effectiveSource: "override",
    note: override.proposed.note,
    reason: override.reason,
    overrideId: override.id,
  };
}

/** Published and not expired at this instant. */
export function isBulletinActive(item: BulletinItem, now = Date.now()): boolean {
  if (item.status !== "published") return false;
  if (!item.expiresAt) return true;
  const expiry = Date.parse(item.expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

function rank(item: BulletinItem, now: number): number {
  if (item.pinned) return 0;
  if (item.urgent) return 1;
  const start = item.startsAt ? Date.parse(item.startsAt) : Number.NaN;
  const end = item.endsAt ? Date.parse(item.endsAt) : Number.NaN;
  if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end) {
    return 2;
  }
  return 3;
}

/** Board order: pinned, urgent, live, then chronological upcoming content. */
export function sortBulletinItems(
  items: BulletinItem[],
  now = Date.now()
): BulletinItem[] {
  return [...items].sort((a, b) => {
    const rankDiff = rank(a, now) - rank(b, now);
    if (rankDiff !== 0) return rankDiff;

    const aStart = a.startsAt ? Date.parse(a.startsAt) : Number.POSITIVE_INFINITY;
    const bStart = b.startsAt ? Date.parse(b.startsAt) : Number.POSITIVE_INFINITY;
    if (aStart !== bStart) return aStart - bStart;

    const aPublished = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bPublished = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bPublished - aPublished || a.id.localeCompare(b.id);
  });
}

/** Aggregate the three intentional-response states. */
export function rsvpCounts(
  rows: { response: RsvpResponse }[]
): RsvpSummary {
  let going = 0;
  let unsure = 0;
  let notGoing = 0;

  for (const row of rows) {
    if (row.response === "going") going += 1;
    else if (row.response === "unsure") unsure += 1;
    else if (row.response === "not_going") notGoing += 1;
  }

  return {
    going,
    unsure,
    notGoing,
    total: going + unsure + notGoing,
  };
}
