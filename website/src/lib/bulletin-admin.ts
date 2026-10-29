import "server-only";

import { rest } from "@/lib/rest";
import type {
  BulletinKind,
  BulletinSource,
  BulletinStatus,
  ClassOccurrenceOverride,
  OutlookEvent,
} from "@/lib/bulletin-types";
import { getOutlookConnectionHealth } from "@/lib/outlook-calendar";
import { getRsvpNames } from "@/lib/bulletin";

export interface BulletinAdminItem {
  id: string;
  kind: BulletinKind;
  source: BulletinSource;
  status: BulletinStatus;
  title: string;
  body: string;
  course: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  meetingUrl: string | null;
  sourceUrl: string | null;
  pinned: boolean;
  urgent: boolean;
  rsvpEnabled: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  updatedAt: string;
}

interface BulletinAdminRow {
  id: string;
  kind: BulletinKind;
  source: BulletinSource;
  status: BulletinStatus;
  title: string;
  body: string;
  course: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  meeting_url: string | null;
  source_url: string | null;
  pinned: boolean;
  urgent: boolean;
  rsvp_enabled: boolean;
  expires_at: string | null;
  published_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  updated_at: string;
}

interface OutlookAdminRow {
  id: string;
  external_id: string;
  subject: string;
  body_preview: string;
  course: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  join_url: string | null;
  web_url: string | null;
  is_cancelled: boolean;
  source_updated_at: string;
}

interface OverrideAdminRow {
  id: string;
  occurrence_key: string;
  source_event_id: string | null;
  course: string;
  action: "cancel" | "change";
  status: "active" | "restored";
  original: ClassOccurrenceOverride["original"];
  proposed: ClassOccurrenceOverride["proposed"];
  reason: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  restored_at: string | null;
}

function item(row: BulletinAdminRow): BulletinAdminItem {
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    status: row.status,
    title: row.title,
    body: row.body,
    course: row.course,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    meetingUrl: row.meeting_url,
    sourceUrl: row.source_url,
    pinned: row.pinned,
    urgent: row.urgent,
    rsvpEnabled: row.rsvp_enabled,
    expiresAt: row.expires_at,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    updatedAt: row.updated_at,
  };
}

function outlook(row: OutlookAdminRow): OutlookEvent {
  return {
    id: row.id,
    externalId: row.external_id,
    subject: row.subject,
    bodyPreview: row.body_preview,
    course: row.course,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    joinUrl: row.join_url,
    webUrl: row.web_url,
    isCancelled: row.is_cancelled,
    sourceUpdatedAt: row.source_updated_at,
  };
}

function override(row: OverrideAdminRow): ClassOccurrenceOverride {
  return {
    id: row.id,
    occurrenceKey: row.occurrence_key,
    sourceEventId: row.source_event_id,
    course: row.course,
    action: row.action,
    status: row.status,
    original: row.original,
    proposed: row.proposed,
    reason: row.reason,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    restoredAt: row.restored_at,
  };
}

async function safeRows<T>(query: string): Promise<T[]> {
  try {
    return (await rest<T[]>(query)) ?? [];
  } catch {
    return [];
  }
}

export async function getBulletinAdminData() {
  const now = new Date().toISOString();
  const [items, events, overrides, connection] = await Promise.all([
    safeRows<BulletinAdminRow>(
      "bulletin_items?select=*&order=updated_at.desc&limit=100"
    ),
    safeRows<OutlookAdminRow>(
      `outlook_events?ends_at=gte.${encodeURIComponent(
        now
      )}&select=*&order=starts_at&limit=60`
    ),
    safeRows<OverrideAdminRow>(
      "class_occurrence_overrides?select=*&order=updated_at.desc&limit=60"
    ),
    getOutlookConnectionHealth(),
  ]);
  const mappedItems = items.map(item);
  const responses = await Promise.all(
    mappedItems
      .filter((entry) => entry.rsvpEnabled)
      .map(async (entry) => [entry.id, await getRsvpNames(entry.id)] as const)
  );
  return {
    items: mappedItems,
    outlookEvents: events.map(outlook),
    overrides: overrides.map(override),
    connection,
    rsvpNames: Object.fromEntries(responses),
  };
}

export async function getBulletinAdminItem(id: string) {
  const rows = await safeRows<BulletinAdminRow>(
    `bulletin_items?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  return rows[0] ? item(rows[0]) : null;
}

export async function saveBulletinItem(args: {
  id: string;
  kind: BulletinKind;
  title: string;
  body: string;
  course: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  meetingUrl: string | null;
  sourceUrl: string | null;
  pinned: boolean;
  urgent: boolean;
  rsvpEnabled: boolean;
  expiresAt: string | null;
  status: "draft" | "published";
  sourceExternalId?: string | null;
  actor: { id: string; name: string };
}): Promise<void> {
  const now = new Date().toISOString();
  await rest("bulletin_items?on_conflict=id", {
    method: "POST",
    body: {
      id: args.id,
      kind: args.kind,
      source: "admin",
      source_external_id: args.sourceExternalId ?? null,
      status: args.status,
      title: args.title,
      body: args.body,
      course: args.course,
      starts_at: args.startsAt,
      ends_at: args.endsAt,
      location: args.location,
      meeting_url: args.meetingUrl,
      source_url: args.sourceUrl,
      pinned: args.pinned,
      urgent: args.urgent,
      rsvp_enabled: args.rsvpEnabled,
      expires_at: args.expiresAt,
      published_at: args.status === "published" ? now : null,
      created_by: args.actor.id,
      created_by_name: args.actor.name,
      updated_at: now,
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function patchBulletinItem(
  id: string,
  values: Record<string, unknown>
) {
  await rest(`bulletin_items?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { ...values, updated_at: new Date().toISOString() },
  });
}

export async function getOutlookEvent(externalId: string) {
  const rows = await safeRows<OutlookAdminRow>(
    `outlook_events?external_id=eq.${encodeURIComponent(
      externalId
    )}&select=*&limit=1`
  );
  return rows[0] ? outlook(rows[0]) : null;
}

export async function getOccurrenceOverride(id: string) {
  const rows = await safeRows<OverrideAdminRow>(
    `class_occurrence_overrides?id=eq.${encodeURIComponent(
      id
    )}&select=*&limit=1`
  );
  return rows[0] ? override(rows[0]) : null;
}

export async function getOverrideForSourceEvent(externalId: string) {
  const rows = await safeRows<OverrideAdminRow>(
    `class_occurrence_overrides?source_event_id=eq.${encodeURIComponent(
      externalId
    )}&select=*&order=updated_at.desc&limit=1`
  );
  return rows[0] ? override(rows[0]) : null;
}

export async function saveOccurrenceOverride(
  entry: ClassOccurrenceOverride
): Promise<void> {
  await rest("class_occurrence_overrides?on_conflict=occurrence_key", {
    method: "POST",
    body: {
      id: entry.id,
      occurrence_key: entry.occurrenceKey,
      source_event_id: entry.sourceEventId,
      course: entry.course,
      action: entry.action,
      status: entry.status,
      original: entry.original,
      proposed: entry.proposed,
      reason: entry.reason,
      created_by: entry.createdBy,
      created_by_name: entry.createdByName,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
      restored_at: entry.restoredAt,
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

export async function restoreOccurrenceOverride(id: string): Promise<void> {
  await rest(`class_occurrence_overrides?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      status: "restored",
      restored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
  await rest(
    `bulletin_items?source_external_id=eq.${encodeURIComponent(id)}`,
    { method: "PATCH", body: { status: "archived", updated_at: new Date().toISOString() } }
  );
}
