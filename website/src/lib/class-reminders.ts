import { breakFor, breaksIn, clockLabel, type BreakSetting } from "@/lib/breaks";
import { buildOccurrenceKey } from "@/lib/bulletin-admin-validation";
import type { ClassOccurrenceOverride } from "@/lib/bulletin-types";
import type { Update, ClassSlot } from "@/lib/notifications";
import { COURSES } from "@/lib/resources";
import { lagosDay, LAGOS_OFFSET_MINUTES } from "@/lib/session-dates";

interface ReminderInput {
  slots: ClassSlot[];
  overrides: ClassOccurrenceOverride[];
  settings: readonly BreakSetting[];
  now: number;
  momentMs?: number;
}

interface EffectiveSlot extends ClassSlot {
  originalStart: number;
}

function wallMinutes(instant: number): number {
  const lagos = new Date(instant + LAGOS_OFFSET_MINUTES * 60_000);
  return lagos.getUTCHours() * 60 + lagos.getUTCMinutes();
}

function applyOverride(
  slot: ClassSlot,
  override: ClassOccurrenceOverride | undefined
): EffectiveSlot | null {
  if (!override || override.status !== "active") {
    return { ...slot, originalStart: slot.start };
  }
  if (override.action === "cancel") return null;

  const start = override.proposed.startsAt
    ? Date.parse(override.proposed.startsAt)
    : slot.start;
  const end = override.proposed.endsAt
    ? Date.parse(override.proposed.endsAt)
    : slot.end;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return {
    ...slot,
    start,
    end,
    venue: override.proposed.location ?? slot.venue,
    startMin: wallMinutes(start),
    endMin: wallMinutes(end),
    originalStart: slot.start,
  };
}

function courseSlug(code: string): string {
  return COURSES.find((course) => course.code === code)?.slug ?? "";
}

function update(
  id: string,
  title: string,
  body: string,
  at: number,
  course: string,
  href = "/timetable"
): Update {
  return {
    id,
    kind: "classes",
    title,
    body,
    at: new Date(at).toISOString(),
    href,
    course,
  };
}

export function planClassNotifications(input: ReminderInput): Update[] {
  const moment = input.momentMs ?? 5 * 60 * 1000;
  const overrides = new Map(
    input.overrides.map((entry) => [entry.occurrenceKey, entry])
  );
  const out: Update[] = [];

  for (const source of input.slots) {
    const key = buildOccurrenceKey(
      source.course,
      new Date(source.start).toISOString()
    );
    const slot = applyOverride(source, overrides.get(key));
    if (!slot) continue;

    const day = lagosDay(new Date(slot.start));
    const endDay = lagosDay(new Date(slot.end));
    const startSoon = slot.start - 5 * 60 * 1000;

    if (startSoon <= input.now && input.now < slot.start) {
      out.push(
        update(
          `class-soon:${slot.course}:${day}:${slot.start}`,
          `${slot.course} starts in five minutes`,
          `${slot.title} · ${slot.venue}`,
          input.now,
          slot.course
        )
      );
    }
    if (slot.start <= input.now && input.now < slot.start + moment) {
      out.push(
        update(
          `class-started:${slot.course}:${day}:${slot.start}`,
          `${slot.course} has started`,
          `${slot.title} · ${slot.venue}`,
          input.now,
          slot.course
        )
      );
    }
    if (slot.end <= input.now && input.now < slot.end + moment) {
      out.push(
        update(
          `class-ended:${slot.course}:${endDay}:${slot.end}`,
          `${slot.course} has just ended`,
          `${slot.title}. The material for it should be on the course page.`,
          input.now,
          slot.course,
          `/courses/${courseSlug(slot.course)}`
        )
      );
    }

    const length = breakFor(
      input.settings,
      source.course,
      source.dayIndex,
      source.startMin
    );
    for (const pause of breaksIn(slot.startMin, slot.endMin, length)) {
      const pauseStart = slot.start + (pause.from - slot.startMin) * 60_000;
      const pauseEnd = slot.start + (pause.to - slot.startMin) * 60_000;
      if (pauseStart - 5 * 60_000 <= input.now && input.now < pauseStart) {
        out.push(
          update(
            `break-soon:${slot.course}:${pauseStart}`,
            `${slot.course} has a break in five minutes`,
            `The lecture pauses at ${clockLabel(pause.from)}. It is ${
              pause.to - pause.from
            } minutes long.`,
            input.now,
            slot.course
          )
        );
      }
      if (pauseStart <= input.now && input.now < pauseStart + moment) {
        out.push(
          update(
            `break-started:${slot.course}:${pauseStart}`,
            `${slot.course} is on a break`,
            `The lecture pauses at ${clockLabel(pause.from)} for ${
              pause.to - pause.from
            } minutes.`,
            input.now,
            slot.course
          )
        );
      }
      if (pauseEnd <= input.now && input.now < pauseEnd + moment) {
        out.push(
          update(
            `break-over:${slot.course}:${pauseEnd}`,
            `The break in ${slot.course} is over`,
            `The lecture is teaching again. It runs until ${clockLabel(
              slot.endMin
            )}.`,
            input.now,
            slot.course
          )
        );
      }
    }
  }

  return out;
}
