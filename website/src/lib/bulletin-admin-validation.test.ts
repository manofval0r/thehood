import { describe, expect, it } from "vitest";
import {
  buildOccurrenceKey,
  validateBulletinWrite,
  validateOverrideWrite,
} from "@/lib/bulletin-admin-validation";

describe("validateBulletinWrite", () => {
  it("allows an ordinary admin to save a draft but not publish", () => {
    expect(
      validateBulletinWrite(
        {
          title: "Room changed",
          body: "Use PG 2.",
          kind: "notice",
          status: "draft",
        },
        "admin"
      )
    ).toMatchObject({ ok: true, status: "draft" });

    expect(
      validateBulletinWrite(
        {
          title: "Room changed",
          body: "Use PG 2.",
          kind: "notice",
          status: "published",
        },
        "admin"
      )
    ).toEqual({ ok: false, error: "Only a super admin can publish." });
  });

  it("allows a super admin to publish a complete item", () => {
    expect(
      validateBulletinWrite(
        {
          title: "Revision session",
          body: "Saturday at 10am.",
          kind: "event",
          status: "published",
        },
        "super"
      )
    ).toMatchObject({ ok: true, status: "published" });
  });
});

describe("validateOverrideWrite", () => {
  const base = {
    action: "cancel" as const,
    reason: "Lecturer is unavailable",
    confirmation: "CANCEL",
    sourceUpdatedAt: "2026-10-28T07:00:00.000Z",
    expectedSourceUpdatedAt: "2026-10-28T07:00:00.000Z",
  };

  it("requires a reason and typed confirmation for cancellation", () => {
    expect(validateOverrideWrite({ ...base, reason: "" })).toEqual({
      ok: false,
      error: "Explain why this occurrence is changing.",
    });
    expect(validateOverrideWrite({ ...base, confirmation: "cancel" })).toEqual({
      ok: false,
      error: "Type CANCEL to confirm this cancellation.",
    });
  });

  it("rejects stale source data instead of overwriting a new Outlook value", () => {
    expect(
      validateOverrideWrite({
        ...base,
        sourceUpdatedAt: "2026-10-28T07:05:00.000Z",
      })
    ).toEqual({
      ok: false,
      error: "The Outlook event changed. Refresh before overriding it.",
    });
  });

  it("builds a key for one Lagos occurrence, not the recurring series", () => {
    expect(
      buildOccurrenceKey("CYB 305", "2026-10-28T09:30:00.000Z")
    ).toBe("CYB 305|2026-10-28|630");
  });
});
