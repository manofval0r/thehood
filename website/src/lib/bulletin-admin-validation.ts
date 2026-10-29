import type { BulletinKind, BulletinStatus } from "@/lib/bulletin-types";
import { LAGOS_OFFSET_MINUTES } from "@/lib/session-dates";

type ValidationResult<T> = { ok: true } & T | { ok: false; error: string };

export function validateBulletinWrite(
  input: {
    title: string;
    body: string;
    kind: BulletinKind;
    status: BulletinStatus;
  },
  role: "super" | "admin"
): ValidationResult<{ status: "draft" | "published" }> {
  if (!input.title.trim()) return { ok: false, error: "Give the bulletin item a title." };
  if (!input.body.trim()) return { ok: false, error: "Add the details students need." };
  if (input.status === "published" && role !== "super") {
    return { ok: false, error: "Only a super admin can publish." };
  }
  return {
    ok: true,
    status: input.status === "published" ? "published" : "draft",
  };
}

export function validateOverrideWrite(input: {
  action: "cancel" | "change";
  reason: string;
  confirmation?: string;
  sourceUpdatedAt: string;
  expectedSourceUpdatedAt: string;
}): ValidationResult<Record<never, never>> {
  if (!input.reason.trim()) {
    return { ok: false, error: "Explain why this occurrence is changing." };
  }
  if (input.sourceUpdatedAt !== input.expectedSourceUpdatedAt) {
    return {
      ok: false,
      error: "The Outlook event changed. Refresh before overriding it.",
    };
  }
  if (input.action === "cancel" && input.confirmation !== "CANCEL") {
    return {
      ok: false,
      error: "Type CANCEL to confirm this cancellation.",
    };
  }
  return { ok: true };
}

export function buildOccurrenceKey(course: string, startsAt: string): string {
  const instant = Date.parse(startsAt);
  if (!Number.isFinite(instant)) throw new Error("The occurrence time is invalid.");
  const lagos = new Date(instant + LAGOS_OFFSET_MINUTES * 60_000);
  const day = lagos.toISOString().slice(0, 10);
  const minutes = lagos.getUTCHours() * 60 + lagos.getUTCMinutes();
  return `${course}|${day}|${minutes}`;
}
