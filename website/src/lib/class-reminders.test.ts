import { describe, expect, it } from "vitest";
import { planClassNotifications } from "@/lib/class-reminders";
import type { BreakSetting } from "@/lib/breaks";
import type { ClassOccurrenceOverride } from "@/lib/bulletin-types";
import type { ClassSlot } from "@/lib/notifications";

const SOURCE_START = Date.parse("2026-10-28T09:00:00.000Z");
const SOURCE_END = Date.parse("2026-10-28T11:00:00.000Z");

const SLOT: ClassSlot = {
  course: "CYB 305",
  title: "Digital Forensics and Investigation Methods",
  start: SOURCE_START,
  end: SOURCE_END,
  day: "Wednesday",
  dayIndex: 3,
  venue: "Cybersecurity Lab",
  lecturer: "Dr Segun",
  startMin: 600,
  endMin: 720,
};

const BREAKS: BreakSetting[] = [
  { course: "CYB 305", dayIndex: 3, startMin: 600, breakMin: 10 },
];

function override(
  partial: Partial<ClassOccurrenceOverride>
): ClassOccurrenceOverride {
  return {
    id: "ovr_1",
    occurrenceKey: "CYB 305|2026-10-28|600",
    sourceEventId: null,
    course: "CYB 305",
    action: "cancel",
    status: "active",
    original: {
      startsAt: new Date(SOURCE_START).toISOString(),
      endsAt: new Date(SOURCE_END).toISOString(),
      location: SLOT.venue,
      meetingUrl: null,
    },
    proposed: {
      startsAt: null,
      endsAt: null,
      location: null,
      meetingUrl: null,
      note: null,
    },
    reason: "Lecturer unavailable",
    createdBy: "st_1",
    createdByName: "Valor",
    createdAt: "2026-10-28T07:00:00.000Z",
    updatedAt: "2026-10-28T07:00:00.000Z",
    restoredAt: null,
    ...partial,
  };
}

describe("planClassNotifications", () => {
  it("emits no start, break, or end reminders for a cancelled occurrence", () => {
    const updates = planClassNotifications({
      slots: [SLOT],
      overrides: [override({})],
      settings: BREAKS,
      now: SOURCE_START,
    });
    expect(updates).toEqual([]);
  });

  it("uses the replacement time and venue for a changed occurrence", () => {
    const replacementStart = Date.parse("2026-10-28T12:00:00.000Z");
    const replacementEnd = Date.parse("2026-10-28T14:00:00.000Z");
    const updates = planClassNotifications({
      slots: [SLOT],
      overrides: [
        override({
          action: "change",
          proposed: {
            startsAt: new Date(replacementStart).toISOString(),
            endsAt: new Date(replacementEnd).toISOString(),
            location: "Zoom",
            meetingUrl: "https://zoom.us/j/123",
            note: "New time",
          },
        }),
      ],
      settings: BREAKS,
      now: replacementStart,
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      id: `class-started:CYB 305:2026-10-28:${replacementStart}`,
      title: "CYB 305 has started",
      body: "Digital Forensics and Investigation Methods · Zoom",
    });
  });

  it("uses the source occurrence again after restore", () => {
    const updates = planClassNotifications({
      slots: [SLOT],
      overrides: [
        override({
          status: "restored",
          restoredAt: "2026-10-28T08:00:00.000Z",
        }),
      ],
      settings: BREAKS,
      now: SOURCE_START,
    });

    expect(updates.map((update) => update.id)).toEqual([
      `class-started:CYB 305:2026-10-28:${SOURCE_START}`,
    ]);
  });

  it("produces stable dedupe keys when the scheduler runs twice", () => {
    const input = {
      slots: [SLOT],
      overrides: [] as ClassOccurrenceOverride[],
      settings: BREAKS,
      now: SOURCE_END,
    };
    expect(planClassNotifications(input).map((update) => update.id)).toEqual(
      planClassNotifications(input).map((update) => update.id)
    );
    expect(planClassNotifications(input)[0].id).toBe(
      `class-ended:CYB 305:2026-10-28:${SOURCE_END}`
    );
  });
});
