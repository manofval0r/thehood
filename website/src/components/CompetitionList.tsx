"use client";

import * as React from "react";
import { MapPin, Monitor, Users } from "lucide-react";
import { isInNigeria, isRemote } from "@/lib/competition-kinds";

/**
 * The competitions.
 *
 * Only the ones a student here can enter are listed: one that is online, or
 * one that is in Nigeria. A competition in another country that needs you
 * in the room is not one they can enter, and a list of things they cannot
 * do is a list that wastes their afternoon.
 *
 * The ones in Nigeria come first, because they are the ones they can walk
 * into.
 */

export interface Competition {
  id: string;
  title: string;
  /** Epoch milliseconds. */
  start: number;
  end: number;
  url: string;
  organizer: string;
  format: string;
  onsite: boolean;
  location: string;
  restrictions: string;
  weight: number;
  description: string;
  hours: number;
}

type Filter = "all" | "online" | "in-person";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function when(ms: number) {
  const d = new Date(ms);
  return {
    day: String(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
    weekday: WEEKDAYS[d.getUTCDay()],
  };
}

/** Nigeria first, then the ones online, then the rest of the world. */
function rank(c: Competition): number {
  if (isInNigeria(c)) return 0;
  if (isRemote(c)) return 1;
  return 2;
}

export default function CompetitionList({
  competitions,
}: {
  competitions: Competition[];
}) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const here = competitions.filter(isInNigeria);
  const online = competitions.filter((c) => !isInNigeria(c) && isRemote(c));
  const away = competitions.filter((c) => !isInNigeria(c) && !isRemote(c));

  const visible = React.useMemo(() => {
    const list =
      filter === "online"
        ? online
        : filter === "in-person"
          ? here
          : [...here, ...online];
    return [...list].sort(
      (a, b) => rank(a) - rank(b) || a.start - b.start
    );
  }, [filter, here, online, away]);

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: here.length + online.length },
    { key: "online", label: "Online", count: online.length },
    { key: "in-person", label: "In Nigeria", count: here.length },
  ];

  return (
    <>
      {/* What is on, before the list of it. */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={on}
              className={
                "pressable inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
                (on
                  ? "border-accent bg-accent/12 text-accent"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
              }
            >
              {f.key === "online" && <Monitor size={13} />}
              {f.key === "in-person" && <MapPin size={13} />}
              {f.label}
              <span
                className={
                  "tnum rounded-full px-1.5 py-0.5 text-[10.5px] " +
                  (on ? "bg-accent/20" : "bg-surface-hover")
                }
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h3 className="text-[14.5px] font-semibold text-foreground">
            Nothing in that group just now
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {filter === "in-person"
              ? "No competition is being held in Nigeria at the moment. The online ones are in the other filter, and most of them are open to anyone who signs up."
              : "The online competitions are in the other filter."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((c, i) => {
            const day = when(c.start);
            const here1 = isInNigeria(c);
            const remote = isRemote(c);
            return (
              <li key={c.id}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-surface-hover"
                  style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                >
                  <span className="w-11 shrink-0 text-center">
                    <span className="block font-mono text-[17px] leading-none text-foreground">
                      {day.day}
                    </span>
                    <span className="mt-1 block text-[10.5px] uppercase tracking-[0.1em] text-muted">
                      {day.month}
                    </span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-[0.08em] text-muted">
                      {day.weekday}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium leading-snug text-foreground">
                      {c.title}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                      {c.organizer && <span>{c.organizer}</span>}
                      <span aria-hidden="true">·</span>
                      <span>{c.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.restrictions}</span>
                      {c.hours > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {c.hours < 24 ? `${c.hours}h` : `${Math.round(c.hours / 24)} days`}
                          </span>
                        </>
                      )}
                      {c.weight > 0 && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]">
                          weight {Math.round(c.weight)}
                        </span>
                      )}
                    </span>

                    {c.description && (
                      <span className="mt-2 block text-[12.5px] leading-relaxed text-muted-foreground">
                        {c.description}
                      </span>
                    )}

                    <span className="mt-2.5 flex flex-wrap items-center gap-2">
                      {here1 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                          <MapPin size={12} />
                          In Nigeria
                        </span>
                      ) : remote ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          <Monitor size={12} />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          <Users size={12} />
                          In person
                        </span>
                      )}
                      {c.location && (
                        <span className="font-mono text-[11px] text-muted">
                          {c.location}
                        </span>
                      )}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
