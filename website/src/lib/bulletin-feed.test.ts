import { describe, expect, it } from "vitest";
import { assembleBulletinFeed } from "@/lib/bulletin-feed";
import type {
  BulletinItem,
  ClassOccurrenceOverride,
  OutlookEvent,
} from "@/lib/bulletin-types";

const NOW = Date.parse("2026-10-28T08:00:00.000Z");

const outlook: OutlookEvent = {
  id: "outlook:meeting-1",
  externalId: "meeting-1",
  subject: "CYB 305 Online Class",
  bodyPreview: "Digital forensics practical",
  course: "CYB 305",
  startsAt: "2026-10-28T09:00:00.000Z",
  endsAt: "2026-10-28T11:00:00.000Z",
  location: "Microsoft Teams",
  joinUrl: "https://teams.microsoft.com/l/meetup-join/private",
  webUrl: "https://outlook.office.com/calendar/item/meeting-1",
  isCancelled: false,
  sourceUpdatedAt: "2026-10-28T07:00:00.000Z",
};

function publicItem(partial: Partial<BulletinItem>): BulletinItem {
  return {
    id: "public-item",
    title: "Public item",
    body: "Body",
    kind: "notice",
    source: "academic_calendar",
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
    publishedAt: "2026-10-28T07:00:00.000Z",
    sourceUpdatedAt: null,
    sourceLabel: "Academic calendar",
    canonicalHref: "/#bulletin-public-item",
    ...partial,
  };
}

function cancelOverride(): ClassOccurrenceOverride {
  return {
    id: "override-1",
    occurrenceKey: "CYB 305|2026-10-28|600",
    sourceEventId: "meeting-1",
    course: "CYB 305",
    action: "cancel",
    status: "active",
    original: {
      startsAt: outlook.startsAt,
      endsAt: outlook.endsAt,
      location: outlook.location,
      meetingUrl: outlook.joinUrl,
      sourceUpdatedAt: outlook.sourceUpdatedAt,
    },
    proposed: {
      startsAt: null,
      endsAt: null,
      location: null,
      meetingUrl: null,
      note: "Do not travel to campus",
    },
    reason: "Lecturer is unavailable",
    createdBy: "st_1",
    createdByName: "Valor",
    createdAt: "2026-10-28T07:30:00.000Z",
    updatedAt: "2026-10-28T07:30:00.000Z",
    restoredAt: null,
  };
}

describe("assembleBulletinFeed", () => {
  it("lets an active cancellation override Outlook and removes its meeting link", () => {
    const feed = assembleBulletinFeed({
      now: NOW,
      archive: false,
      adminItems: [],
      outlookEvents: [outlook],
      overrides: [cancelOverride()],
      timetableItems: [],
      academicItems: [],
      assessments: [],
      rsvps: [],
      studentMatric: null,
    });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      id: "outlook:meeting-1",
      title: "CYB 305 Online Class cancelled",
      kind: "alert",
      urgent: true,
      hasMeeting: false,
      sourceLabel: "Super-admin override",
    });
    expect(JSON.stringify(feed)).not.toContain("teams.microsoft.com");
  });

  it("redacts stored meeting URLs while preserving hasMeeting", () => {
    const feed = assembleBulletinFeed({
      now: NOW,
      archive: false,
      adminItems: [
        {
          ...publicItem({
            id: "admin-class",
            source: "admin",
            kind: "class",
            hasMeeting: true,
            startsAt: "2026-10-28T09:00:00.000Z",
            endsAt: "2026-10-28T10:00:00.000Z",
          }),
          meetingUrl: "https://zoom.us/j/private",
        },
      ],
      outlookEvents: [],
      overrides: [],
      timetableItems: [],
      academicItems: [],
      assessments: [],
      rsvps: [],
      studentMatric: null,
    });

    expect(feed.items[0].hasMeeting).toBe(true);
    expect(feed.items[0].canonicalHref).toBe("/#bulletin-admin-class");
    expect(Object.hasOwn(feed.items[0], "meetingUrl")).toBe(false);
    expect(JSON.stringify(feed)).not.toContain("zoom.us");
  });

  it("prefers Outlook over a duplicate timetable occurrence", () => {
    const feed = assembleBulletinFeed({
      now: NOW,
      archive: false,
      adminItems: [],
      outlookEvents: [outlook],
      overrides: [],
      timetableItems: [
        publicItem({
          id: "timetable-class",
          kind: "class",
          source: "timetable",
          course: "CYB 305",
          startsAt: outlook.startsAt,
          endsAt: outlook.endsAt,
        }),
      ],
      academicItems: [],
      assessments: [],
      rsvps: [],
      studentMatric: null,
    });

    expect(feed.items.map((item) => item.id)).toEqual(["outlook:meeting-1"]);
  });

  it("includes only the verified student's assessments", () => {
    const feed = assembleBulletinFeed({
      now: NOW,
      archive: false,
      adminItems: [],
      outlookEvents: [],
      overrides: [],
      timetableItems: [],
      academicItems: [],
      assessments: [
        {
          id: "mine",
          title: "My assignment",
          type: "assignment",
          courseCode: "CYB 305",
          dueAt: "2026-10-29T09:00:00.000Z",
          studentId: "2423131001",
        },
        {
          id: "theirs",
          title: "Their assignment",
          type: "assignment",
          courseCode: "CYB 305",
          dueAt: "2026-10-29T09:00:00.000Z",
          studentId: "2423131002",
        },
      ],
      rsvps: [],
      studentMatric: "2423131001",
    });

    expect(feed.items.map((entry) => entry.title)).toEqual(["My assignment"]);
    expect(feed.items[0].canonicalHref).toBe("/assessments#mine");
  });

  it("exposes public RSVP counts and only the current student's response", () => {
    const feed = assembleBulletinFeed({
      now: NOW,
      archive: false,
      adminItems: [publicItem({ id: "event", kind: "event", rsvpEnabled: true })],
      outlookEvents: [],
      overrides: [],
      timetableItems: [],
      academicItems: [],
      assessments: [],
      rsvps: [
        { bulletinId: "event", matric: "2423131001", response: "going" },
        { bulletinId: "event", matric: "2423131002", response: "unsure" },
      ],
      studentMatric: "2423131001",
    });

    expect(feed.items[0].rsvp).toEqual({
      going: 1,
      unsure: 1,
      notGoing: 0,
      total: 2,
      mine: "going",
    });
    expect(JSON.stringify(feed)).not.toContain("2423131002");
  });
});
