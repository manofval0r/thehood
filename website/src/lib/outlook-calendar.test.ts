import { describe, expect, it } from "vitest";
import {
  createOutlookState,
  decryptOutlookToken,
  encryptOutlookToken,
  extractMeetingUrl,
  inferCourse,
  normalizeGraphEvent,
  readOutlookState,
} from "@/lib/outlook-calendar-core";

describe("inferCourse", () => {
  it("finds normalized course codes in the subject or preview", () => {
    expect(inferCourse("CYB 305 online class", "")).toBe("CYB 305");
    expect(inferCourse("Digital forensics", "NUT-CYB 312 follow-up")).toBe(
      "NUT-CYB 312"
    );
    expect(inferCourse("Student town hall", "All cohorts")).toBeNull();
  });
});

describe("extractMeetingUrl", () => {
  it("prefers the structured Teams join URL", () => {
    expect(
      extractMeetingUrl({
        onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/abc" },
        onlineMeetingUrl: "https://zoom.us/j/secondary",
        bodyPreview: "https://zoom.us/j/body",
      })
    ).toBe("https://teams.microsoft.com/l/meetup-join/abc");
  });

  it("extracts Zoom and Teams URLs from event text and rejects unrelated links", () => {
    expect(
      extractMeetingUrl({
        bodyPreview: "Join https://zoom.us/j/123456789?pwd=abc before 9am",
      })
    ).toBe("https://zoom.us/j/123456789?pwd=abc");
    expect(extractMeetingUrl({ bodyPreview: "Read https://example.com" })).toBeNull();
  });
});

describe("normalizeGraphEvent", () => {
  it("normalizes cancellation, UTC time, course, and meeting link", () => {
    expect(
      normalizeGraphEvent({
        id: "AAMk-1",
        subject: "CYB 305 Online Class",
        bodyPreview: "Class details",
        start: { dateTime: "2026-10-28T09:00:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-28T11:00:00.0000000", timeZone: "UTC" },
        location: { displayName: "Microsoft Teams" },
        onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/abc" },
        webLink: "https://outlook.office.com/calendar/item/1",
        isCancelled: true,
        lastModifiedDateTime: "2026-10-28T07:00:00Z",
      })
    ).toMatchObject({
      externalId: "AAMk-1",
      course: "CYB 305",
      startsAt: "2026-10-28T09:00:00.000Z",
      endsAt: "2026-10-28T11:00:00.000Z",
      isCancelled: true,
      joinUrl: "https://teams.microsoft.com/l/meetup-join/abc",
    });
  });
});

describe("encrypted Outlook credentials", () => {
  it("round-trips and rejects tampering or another secret", () => {
    const encrypted = encryptOutlookToken("refresh-token", "admin-secret");
    const parts = encrypted.split(".");
    parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;
    const tampered = parts.join(".");
    expect(decryptOutlookToken(encrypted, "admin-secret")).toBe("refresh-token");
    expect(decryptOutlookToken(tampered, "admin-secret")).toBeNull();
    expect(decryptOutlookToken(encrypted, "other-secret")).toBeNull();
  });
});

describe("OAuth state", () => {
  it("round-trips before expiry and rejects expiry or tampering", () => {
    const state = createOutlookState(
      { staffId: "st_1", expiresAt: 2_000 },
      "admin-secret"
    );
    expect(readOutlookState(state, "admin-secret", 1_999)).toEqual({
      staffId: "st_1",
      expiresAt: 2_000,
    });
    expect(readOutlookState(state, "admin-secret", 2_000)).toBeNull();
    expect(readOutlookState(`${state}x`, "admin-secret", 1_999)).toBeNull();
  });
});
