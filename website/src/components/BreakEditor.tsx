"use client";

import * as React from "react";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { SCHEDULE, formatRange } from "@/lib/schedule";
import {
  DEFAULT_BREAK_MIN,
  breakFor,
  breakPhrase,
  type BreakSetting,
} from "@/lib/breaks";
import { setSessionBreak } from "@/app/admin/actions";

/**
 * The breaks in every lecture of the week.
 *
 * The length is a row of buttons rather than a number box, because the
 * choice is a small set of minutes that a lecturer would recognise, and
 * because a number box invites somebody to type a value nobody has ever
 * had a break for.
 *
 * The default is ten minutes and most lectures keep it. Zero is a real
 * setting rather than the absence of one, so a lecture that runs straight
 * through is written down.
 */

const LENGTHS = [0, 5, 10, 15, 20];

export default function BreakEditor({
  breaks,
}: {
  breaks: BreakSetting[];
}) {
  const [settings, setSettings] = React.useState<BreakSetting[]>(breaks);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState<string | null>(null);

  const change = (course: string, dayIndex: number, startMin: number, breakMin: number) => {
    // The change is shown at once and saved in the background, so the page
    // does not wait for a round trip before the button moves.
    setSettings((prev) => {
      const key = `${course}|${dayIndex}|${startMin}`;
      const without = prev.filter(
        (s) => `${s.course}|${s.dayIndex}|${s.startMin}` !== key
      );
      return [...without, { course, dayIndex, startMin, breakMin }];
    });

    startTransition(async () => {
      await setSessionBreak({ course, dayIndex, startMin, breakMin });
      setSaved(`${course}|${dayIndex}|${startMin}`);
      window.setTimeout(() => setSaved(null), 1800);
    });
  };

  const byDay = React.useMemo(() => {
    const out: { day: string; slots: typeof SCHEDULE }[] = [];
    for (const course of SCHEDULE) {
      const found = out.find((d) => d.day === course.dayName);
      if (found) found.slots.push(course);
      else out.push({ day: course.dayName, slots: [course] });
    }
    return out;
  }, []);

  return (
    <div className="space-y-8">
      {byDay.map(({ day, slots }) => (
        <section key={day}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            {day}
          </h3>

          <ul className="mt-2.5 divide-y divide-border border-y border-border">
            {slots.map((s) => {
              const key = `${s.code}|${s.dayIndex}|${s.startMin}`;
              const current = breakFor(settings, s.code, s.dayIndex, s.startMin);
              const isDefault = !settings.some(
                (b) =>
                  b.course === s.code &&
                  b.dayIndex === s.dayIndex &&
                  b.startMin === s.startMin
              );
              const phrase = breakPhrase(s.startMin, s.endMin, current);

              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                >
                  <span className="tnum w-[9.5rem] shrink-0 font-mono text-[12px] text-foreground">
                    {formatRange(s.startMin, s.endMin)}
                  </span>

                  <span className="w-[7rem] shrink-0 font-mono text-[12px] font-bold text-accent">
                    {s.code}
                  </span>

                  <span className="min-w-[12rem] flex-1">
                    <span className="block text-[13px] text-foreground">
                      {s.title}
                    </span>
                    <span className="block text-[11.5px] text-muted">
                      {s.venue}
                      {phrase && (
                        <span className="text-muted-foreground"> · {phrase}</span>
                      )}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className="flex overflow-hidden rounded-md border border-border"
                      role="group"
                      aria-label={`Break in ${s.code} on ${s.dayName}`}
                    >
                      {LENGTHS.map((n) => {
                        const on = current === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              change(s.code, s.dayIndex, s.startMin, n)
                            }
                            aria-pressed={on}
                            className={`pressable px-2.5 py-1.5 font-mono text-[11.5px] transition-colors max-sm:min-h-11 max-sm:min-w-11 max-sm:px-2 ${
                              on
                                ? "bg-accent text-accent-foreground"
                                : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                            }`}
                          >
                            {n === 0 ? "None" : `${n}`}
                          </button>
                        );
                      })}
                    </span>

                    <span
                      className="w-16 shrink-0 text-right text-[11px] text-muted"
                      aria-live="polite"
                    >
                      {saved === key ? (
                        <span className="inline-flex items-center gap-1 text-accent">
                          <Check size={12} />
                          Saved
                        </span>
                      ) : isDefault ? (
                        "default"
                      ) : (
                        `${current} min`
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {pending && (
        <p className="text-[12px] text-muted" aria-live="polite">
          Saving
        </p>
      )}

      <p className="text-[12px] leading-relaxed text-muted">
        A break falls at the end of each hour of a lecture, and the last hour
        has none in it, so a three hour lecture with a ten minute break has
        two breaks and still ends when it was scheduled to end. The default is
        {DEFAULT_BREAK_MIN} minutes.
      </p>
    </div>
  );
}
