"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentStaff } from "@/lib/admin-session";
import { isSuper, writeAudit, type StaffMember } from "@/lib/staff";
import {
  getBulletinAdminItem,
  getOccurrenceOverride,
  getOutlookEvent,
  getOverrideForSourceEvent,
  patchBulletinItem,
  restoreOccurrenceOverride,
  saveBulletinItem,
  saveOccurrenceOverride,
} from "@/lib/bulletin-admin";
import {
  buildOccurrenceKey,
  validateBulletinWrite,
  validateOverrideWrite,
} from "@/lib/bulletin-admin-validation";
import { syncManagedOutlook } from "@/lib/outlook-calendar";
import {
  createAnnouncement,
  recordDelivery,
} from "@/lib/announcements";
import { announceBroadcast } from "@/lib/push";
import type {
  BulletinKind,
  ClassOccurrenceOverride,
} from "@/lib/bulletin-types";

export interface BulletinActionState {
  error?: string;
  done?: string;
  id?: string;
}

async function requireStaff(): Promise<StaffMember> {
  const staff = await currentStaff();
  if (!staff) throw new Error("Not signed in.");
  return staff;
}

async function requireSuper(): Promise<StaffMember> {
  const staff = await requireStaff();
  if (!isSuper(staff)) throw new Error("Only a super admin can do that.");
  return staff;
}

function optional(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function lagosDateTime(value: string | null): string | null {
  if (!value) return null;
  const withZone = /Z|[+-]\d\d:\d\d$/.test(value)
    ? value
    : `${value.length === 16 ? `${value}:00` : value}+01:00`;
  const instant = Date.parse(withZone);
  if (!Number.isFinite(instant)) throw new Error("That date and time cannot be read.");
  return new Date(instant).toISOString();
}

const KINDS: BulletinKind[] = [
  "class",
  "alert",
  "notice",
  "event",
  "deadline",
  "resource",
];

export async function saveBulletinDraft(
  _previous: BulletinActionState,
  formData: FormData
): Promise<BulletinActionState> {
  const staff = await requireStaff();
  const id = optional(formData, "id") ?? `bul_${randomUUID().slice(0, 12)}`;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawKind = String(formData.get("kind") ?? "notice") as BulletinKind;
  const kind = KINDS.includes(rawKind) ? rawKind : "notice";
  const validation = validateBulletinWrite(
    { title, body, kind, status: "draft" },
    staff.role
  );
  if (!validation.ok) return { error: validation.error };

  const existing = await getBulletinAdminItem(id);
  if (
    existing &&
    existing.status !== "draft"
  ) {
    return { error: "Only a draft can be edited here." };
  }
  if (existing && existing.createdBy !== staff.id && !isSuper(staff)) {
    return { error: "That draft belongs to another member of staff." };
  }

  let startsAt: string | null;
  let endsAt: string | null;
  let expiresAt: string | null;
  try {
    startsAt = lagosDateTime(optional(formData, "startsAt"));
    endsAt = lagosDateTime(optional(formData, "endsAt"));
    expiresAt = lagosDateTime(optional(formData, "expiresAt"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The date is invalid." };
  }
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { error: "The end has to be after the start." };
  }

  await saveBulletinItem({
    id,
    kind,
    title,
    body,
    course: optional(formData, "course"),
    startsAt,
    endsAt,
    location: optional(formData, "location"),
    meetingUrl: optional(formData, "meetingUrl"),
    sourceUrl: optional(formData, "sourceUrl"),
    pinned: isSuper(staff) && formData.get("pinned") === "on",
    urgent: isSuper(staff) && formData.get("urgent") === "on",
    rsvpEnabled: formData.get("rsvpEnabled") === "on",
    expiresAt,
    status: "draft",
    actor: { id: staff.id, name: staff.name },
  });
  await writeAudit({
    actor: staff,
    action: existing ? "bulletin_draft_updated" : "bulletin_draft_created",
    targetId: id,
    targetName: title,
    detail: optional(formData, "course"),
  });
  revalidatePath("/admin/bulletin");
  return { done: "Draft saved.", id };
}

export async function publishBulletinItem(id: string): Promise<void> {
  const staff = await requireSuper();
  const item = await getBulletinAdminItem(id);
  if (!item) throw new Error("That bulletin item is no longer there.");
  const validation = validateBulletinWrite(
    { title: item.title, body: item.body, kind: item.kind, status: "published" },
    staff.role
  );
  if (!validation.ok) throw new Error(validation.error);
  await patchBulletinItem(id, {
    status: "published",
    published_at: new Date().toISOString(),
  });
  await writeAudit({
    actor: staff,
    action: "bulletin_published",
    targetId: id,
    targetName: item.title,
    detail: item.course,
  });
  revalidatePath("/");
  revalidatePath("/bulletin");
  revalidatePath("/admin/bulletin");
}

export async function archiveBulletinItem(id: string): Promise<void> {
  const staff = await requireSuper();
  const item = await getBulletinAdminItem(id);
  if (!item) throw new Error("That bulletin item is no longer there.");
  await patchBulletinItem(id, { status: "archived" });
  await writeAudit({
    actor: staff,
    action: "bulletin_archived",
    targetId: id,
    targetName: item.title,
  });
  revalidatePath("/");
  revalidatePath("/bulletin");
  revalidatePath("/admin/bulletin");
}

export async function toggleBulletinPin(
  id: string,
  pinned: boolean
): Promise<void> {
  const staff = await requireSuper();
  const item = await getBulletinAdminItem(id);
  if (!item) throw new Error("That bulletin item is no longer there.");
  await patchBulletinItem(id, { pinned });
  await writeAudit({
    actor: staff,
    action: pinned ? "bulletin_pinned" : "bulletin_unpinned",
    targetId: id,
    targetName: item.title,
  });
  revalidatePath("/");
  revalidatePath("/admin/bulletin");
}

function overrideId(occurrenceKey: string): string {
  return `ovr_${createHash("sha256")
    .update(occurrenceKey)
    .digest("hex")
    .slice(0, 16)}`;
}

export async function saveClassOverride(
  _previous: BulletinActionState,
  formData: FormData
): Promise<BulletinActionState> {
  const staff = await requireSuper();
  const sourceEventId = String(formData.get("sourceEventId") ?? "").trim();
  const source = await getOutlookEvent(sourceEventId);
  if (!source) return { error: "The Outlook event is no longer available." };

  const action = formData.get("action") === "cancel" ? "cancel" : "change";
  const reason = String(formData.get("reason") ?? "").trim();
  const validation = validateOverrideWrite({
    action,
    reason,
    confirmation: String(formData.get("confirmation") ?? ""),
    sourceUpdatedAt: source.sourceUpdatedAt,
    expectedSourceUpdatedAt: String(
      formData.get("expectedSourceUpdatedAt") ?? ""
    ),
  });
  if (!validation.ok) return { error: validation.error };
  if (!source.course) {
    return { error: "Assign this Outlook event to a course before overriding it." };
  }

  let startsAt: string | null = null;
  let endsAt: string | null = null;
  try {
    startsAt = lagosDateTime(optional(formData, "startsAt"));
    endsAt = lagosDateTime(optional(formData, "endsAt"));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The date is invalid." };
  }
  if (action === "change" && startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { error: "The replacement end has to be after its start." };
  }

  const occurrenceKey = buildOccurrenceKey(source.course, source.startsAt);
  const existing = await getOverrideForSourceEvent(source.externalId);
  const id = existing?.id ?? overrideId(occurrenceKey);
  const now = new Date().toISOString();
  const entry: ClassOccurrenceOverride = {
    id,
    occurrenceKey,
    sourceEventId: source.externalId,
    course: source.course,
    action,
    status: "active",
    original: {
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      location: source.location,
      meetingUrl: source.joinUrl,
      sourceUpdatedAt: source.sourceUpdatedAt,
    },
    proposed: {
      startsAt: action === "change" ? startsAt : null,
      endsAt: action === "change" ? endsAt : null,
      location:
        action === "change" ? optional(formData, "location") : null,
      meetingUrl:
        action === "change" ? optional(formData, "meetingUrl") : null,
      note: optional(formData, "note"),
    },
    reason,
    createdBy: staff.id,
    createdByName: staff.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    restoredAt: null,
  };
  await saveOccurrenceOverride(entry);

  const effectiveStart = entry.proposed.startsAt ?? source.startsAt;
  const effectiveEnd = entry.proposed.endsAt ?? source.endsAt;
  await saveBulletinItem({
    id: `override:${id}`,
    kind: action === "cancel" ? "alert" : "class",
    title:
      action === "cancel"
        ? `${source.subject} cancelled`
        : `${source.subject} changed`,
    body: [entry.proposed.note, reason].filter(Boolean).join(" · "),
    course: source.course,
    startsAt: effectiveStart,
    endsAt: effectiveEnd,
    location: entry.proposed.location ?? source.location,
    meetingUrl:
      action === "cancel"
        ? null
        : entry.proposed.meetingUrl ?? source.joinUrl,
    sourceUrl: source.webUrl,
    pinned: true,
    urgent: true,
    rsvpEnabled: false,
    expiresAt: new Date(Date.parse(effectiveEnd) + 6 * 60 * 60 * 1000).toISOString(),
    status: "published",
    sourceExternalId: id,
    actor: { id: staff.id, name: staff.name },
  });
  await writeAudit({
    actor: staff,
    action: action === "cancel" ? "class_cancelled" : "class_overridden",
    targetId: id,
    targetName: source.subject,
    detail: `${source.course}: ${reason}`,
  });
  const announcementId = `class-change:${id}:${Date.parse(now)}`;
  const announcementTitle =
    action === "cancel"
      ? `${source.course} is cancelled`
      : `${source.course} class details changed`;
  const announcementBody = [entry.proposed.note, reason]
    .filter(Boolean)
    .join(" · ");
  await createAnnouncement({
    id: announcementId,
    title: announcementTitle,
    body: announcementBody,
    kind: "classes",
    course: source.course,
    href: `/#bulletin-override:${id}`,
    urgent: true,
    needsAck: true,
    status: "sent",
    scheduledFor: null,
    by: { id: staff.id, name: staff.name },
  });
  const delivery = await announceBroadcast({
    id: announcementId,
    title: announcementTitle,
    body: announcementBody,
    kind: "classes",
    course: source.course,
    href: `/#bulletin-override:${id}`,
    urgent: true,
  });
  await recordDelivery(announcementId, delivery);
  revalidatePath("/");
  revalidatePath("/bulletin");
  revalidatePath("/admin/bulletin");
  return { done: "The one-occurrence override is now live.", id };
}

export async function restoreClassOverride(
  id: string,
  expectedUpdatedAt: string
): Promise<void> {
  const staff = await requireSuper();
  const entry = await getOccurrenceOverride(id);
  if (!entry) throw new Error("That override no longer exists.");
  if (entry.updatedAt !== expectedUpdatedAt) {
    throw new Error("The override changed. Refresh before restoring it.");
  }
  await restoreOccurrenceOverride(id);
  await writeAudit({
    actor: staff,
    action: "class_override_restored",
    targetId: id,
    targetName: entry.course,
    detail: entry.reason,
  });
  revalidatePath("/");
  revalidatePath("/bulletin");
  revalidatePath("/admin/bulletin");
}

export async function syncOutlookNow(): Promise<void> {
  const staff = await requireSuper();
  const result = await syncManagedOutlook();
  await writeAudit({
    actor: staff,
    action: "outlook_synced",
    targetName: "Managed Outlook calendar",
    detail: `${result.synced} synced, ${result.skipped} skipped`,
  });
  revalidatePath("/");
  revalidatePath("/admin/bulletin");
}
