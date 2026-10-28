import { describe, expect, it } from "vitest";
import {
  effectiveOccurrence,
  isBulletinActive,
  rsvpCounts,
  sortBulletinItems,
} from "@/lib/bulletin-domain";
import type {
  BulletinItem,
  ClassOccurrenceOverride,
  OutlookEvent,
} from "@/lib/bulletin-types";

const SOURCE: OutlookEvent = {
  id: "outlook:abc",
  externalId: "abc",
  subject: "CYB 305 Online Class",
  bodyPreview: "Digital forensics practical",
  course: "CYB 305",
  startsAt: "2026-10-28T09:00:00.000Z",
  endsAt: "2026-10-28T11:00:00.000Z",
  location: "Microsoft Teams",
  joinUrl: "https://teams.microsoft.com/l/meetup-join/abc",
  webUrl: "https://outlook.office.com/calendar/item/abc",
  isCancelled: false,
  sourceUpdatedAt: "2026-10-28T07:00:00.000Z",
};

function override(
  partial: Partial<ClassOccurrenceOverride>
): ClassOccurrenceOverride {
  return {
    id: "ovr_1",
    occurrenceKey: "CYB 305|2026-10-28|600",
    sourceEventId: "abc",
    course: "CYB 305",
    action: "change",
    status: "active",
    original: {
      startsAt: SOURCE.startsAt,
      endsAt: SOURCE.endsAt,
      location: SOURCE.location,
      meetingUrl: SOURCE.joinUrl,
      sourceUpdatedAt: SOURCE.sourceUpdatedAt,
    },
    proposed: {
      startsAt: null,
      endsAt: null,
      location: null,
      meetingUrl: null,
      note: null,
    },
    reason: "Lecturer requested a later start",
    createdBy: "st_1",
    createdByName: "Valor",
    createdAt: "2026-10-28T08:00:00.000Z",
    updatedAt: "2026-10-28T08:00:00.000Z",
    restoredAt: null,
    ...partial,
  };
}

function item(partial: Partial<BulletinItem>): BulletinItem {
  return {
    id: "item",
    title: "Item",
    body: "Body",
    kind: "notice",
    source: "admin",
    status: "published",
    course: null,
    startsAt: null,
    endsAt: null,
    location: null,
    hasMeeting: false,
    pinned: false,
    urgent: false,
    rsvpEnabled: false,
    expiresAt: null,
    publishedAt: "2026-10-28T08:00:00.000Z",
    sourceUpdatedAt: "2026-10-28T08:00:00.000Z",
    sourceLabel: "Staff",
    canonicalHref: "/#bulletin-item",
    ...partial,
  };
}

describe("effectiveOccurrence", () => {
  it("lets an active cancellation override the Outlook event", () => {
    const result = effectiveOccurrence(
      SOURCE,
      override({ action: "cancel" })
    );

    expect(result).toMatchObject({
      status: "cancelled",
      effectiveSource: "override",
      meetingUrl: null,
      reason: "Lecturer requested a later start",
    });
  });

  it("uses proposed time, place, link, and note for a changed occurrence", () => {
    const result = effectiveOccurrence(
      SOURCE,
      override({
        proposed: {
          startsAt: "2026-10-28T12:00:00.000Z",
          endsAt: "2026-10-28T14:00:00.000Z",
          location: "Zoom",
          meetingUrl: "https://zoom.us/j/123",
          note: "Starts three hours later",
        },
      })
    );

    expect(result).toMatchObject({
      startsAt: "2026-10-28T12:00:00.000Z",
      endsAt: "2026-10-28T14:00:00.000Z",
      location: "Zoom",
      meetingUrl: "https://zoom.us/j/123",
      note: "Starts three hours later",
      effectiveSource: "override",
    });
  });

  it("ignores a restored override", () => {
    const result = effectiveOccurrence(
      SOURCE,
      override({ status: "restored", restoredAt: "2026-10-28T08:30:00Z" })
    );

    expect(result).toMatchObject({
      startsAt: SOURCE.startsAt,
      meetingUrl: SOURCE.joinUrl,
      effectiveSource: "outlook",
      status: "scheduled",
    });
  });

  it("rejects malformed source timestamps", () => {
    expect(effectiveOccurrence({ ...SOURCE, startsAt: "not-a-date" }, null)).toBeNull();
  });
});

describe("isBulletinActive", () => {
  const now = Date.parse("2026-10-28T12:00:00.000Z");

  it("includes a published item before its expiry", () => {
    expect(
      isBulletinActive(
        item({ expiresAt: "2026-10-28T12:00:00.001Z" }),
        now
      )
    ).toBe(true);
  });

  it("archives an item exactly at its expiry", () => {
    expect(
      isBulletinActive(item({ expiresAt: "2026-10-28T12:00:00.000Z" }), now)
    ).toBe(false);
  });

  it("rejects drafts and malformed expiry values", () => {
    expect(isBulletinActive(item({ status: "draft" }), now)).toBe(false);
    expect(isBulletinActive(item({ expiresAt: "bad" }), now)).toBe(false);
  });
});

describe("sortBulletinItems", () => {
  it("orders pinned first, then urgent, live, and upcoming", () => {
    const now = Date.parse("2026-10-28T10:00:00.000Z");
    const sorted = sortBulletinItems(
      [
        item({ id: "upcoming", startsAt: "2026-10-28T12:00:00.000Z" }),
        item({ id: "live", startsAt: "2026-10-28T09:00:00.000Z", endsAt: "2026-10-28T11:00:00.000Z" }),
        item({ id: "urgent", urgent: true }),
        item({ id: "pinned", pinned: true }),
      ],
      now
    );

    expect(sorted.map((entry) => entry.id)).toEqual([
      "pinned",
      "urgent",
      "live",
      "upcoming",
    ]);
  });
});

describe("rsvpCounts", () => {
  it("aggregates responses without inventing missing categories", () => {
    expect(
      rsvpCounts([
        { response: "going" },
        { response: "going" },
        { response: "unsure" },
        { response: "not_going" },
      ])
    ).toEqual({ going: 2, unsure: 1, notGoing: 1, total: 4 });
  });
});
