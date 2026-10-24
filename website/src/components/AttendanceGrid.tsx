"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  BOX_CHOICES,
  BoxGlyph,
  boxLabel,
  type BoxState,
} from "@/components/AttendanceBox";
import { markBox, markClass } from "@/app/admin/actions";

/**
 * The marking grid.
 *
 * Rows are students, columns are the classes in the chosen week. One box per
 * class per student, which is the shape the whole idea was drawn from.
 *
 * Clicking a box opens the same chooser the column headers use, so a single
 * mark and a whole class are marked in one language. The box fills the moment
 * it is clicked; the write follows.
 */

export interface GridStudent {
  matric: string;
  name: string;
}

export interface GridDate {
  /** ISO, yyyy-mm-dd. */
  iso: string;
  weekday: string;
  day: string;
  month: string;
}

export interface Standing {
  /** Percentage of marked sessions attended, 0 to 100. */
  pct: number;
  /** Sessions that were actually marked. */
  marked: number;
  /** Sessions excused, which are not counted against anyone. */
  excused: number;
}

export interface AttendanceGridProps {
  course: string;
  courseTitle: string;
  students: GridStudent[];
  dates: GridDate[];
  /** Key is `${iso}|${matric}`. */
  initial: Record<string, BoxState>;
  standing: Record<string, Standing>;
}

const keyOf = (iso: string, matric: string) => `${iso}|${matric}`;

export function AttendanceGrid({
  course,
  courseTitle,
  students,
  dates,
  initial,
  standing,
}: AttendanceGridProps) {
  const serverState = JSON.stringify(initial);
  const [cells, setCells] = useState<Record<string, BoxState>>(initial);
  const [, startTransition] = useTransition();

  // The standing is worked out on the server across every session recorded
  // for the course, so it has to arrive from the server rather than be
  // counted here. It is kept in state so the number moves the moment the
  // server has re-sent it, without waiting for a full page load.
  const standingState = JSON.stringify(standing);
  const [liveStanding, setLiveStanding] = useState(standing);
  const [open, setOpen] = useState<{
    key: string;
    anchor: DOMRect;
    bulk: boolean;
    iso: string;
  } | null>(null);

  // The server is the record. When it sends a new truth, take it.
  useEffect(() => {
    setCells(JSON.parse(serverState) as Record<string, BoxState>);
  }, [serverState]);

  useEffect(() => {
    setLiveStanding(JSON.parse(standingState) as Record<string, Standing>);
  }, [standingState]);

  function mark(iso: string, matric: string, next: BoxState) {
    const key = keyOf(iso, matric);
    setCells((c) => ({ ...c, [key]: next }));
    startTransition(async () => {
      await markBox({
        course,
        sessionDate: iso,
        matric,
        fill: next.fill,
        excused: next.excused,
      });
    });
  }

  function markWholeClass(iso: string, next: BoxState) {
    startTransition(async () => {
      await markClass({
        course,
        sessionDate: iso,
        matrics: students.map((s) => s.matric),
        fill: next.fill,
        excused: next.excused,
      });
    });
  }

  const markedCount = (iso: string) =>
    students.filter((s) => {
      const cell = cells[keyOf(iso, s.matric)];
      return cell && (cell.fill !== null || cell.excused);
    }).length;

  return (
    <>
      <p className="mb-2 text-[11.5px] text-muted sm:hidden">
        Scroll sideways to see every class in the week.
      </p>
      <div
        role="region"
        tabIndex={0}
        aria-label={`Attendance for ${courseTitle}. Scrolls sideways for every class in the week.`}
        className="overflow-x-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Attendance for {courseTitle}. Rows are students, columns are the
            classes in the week. Each cell is one box.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Student
              </th>
              {dates.map((d) => (
                <th
                  key={d.iso}
                  scope="col"
                  className="px-2 py-2 text-center align-bottom"
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {d.weekday}
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium text-foreground">
                    {d.day} {d.month}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted">
                    {markedCount(d.iso)} of {students.length} marked
                  </span>
                  <button
                    type="button"
                    onClick={(e) =>
                      setOpen({
                        key: `bulk|${d.iso}`,
                        anchor: e.currentTarget.getBoundingClientRect(),
                        bulk: true,
                        iso: d.iso,
                      })
                    }
                    className="pressable group mx-auto mt-1.5 block rounded p-1 text-border-strong hover:text-muted-foreground max-sm:inline-flex max-sm:h-11 max-sm:w-11 max-sm:items-center max-sm:justify-center"
                    title={`Mark the whole class on ${d.weekday} ${d.day} ${d.month}`}
                  >
                    <span className="sr-only">
                      Mark the whole class on {d.weekday} {d.day} {d.month}
                    </span>
                    <BoxGlyph
                      state={{ fill: null, excused: false }}
                      className="h-3.5 w-3.5"
                    />
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Standing
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const st = liveStanding[s.matric];
              return (
                <tr
                  key={s.matric}
                  className="border-b border-border last:border-b-0"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-3 py-2 font-normal"
                  >
                    <span className="block truncate text-[13px] font-medium text-foreground">
                      {s.name}
                    </span>
                    <span className="block text-[11px] text-muted">{s.matric}</span>
                  </th>
                  {dates.map((d) => {
                    const key = keyOf(d.iso, s.matric);
                    const state = cells[key] ?? { fill: null, excused: false };
                    return (
                      <td key={d.iso} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) =>
                            setOpen({
                              key,
                              anchor: e.currentTarget.getBoundingClientRect(),
                              bulk: false,
                              iso: d.iso,
                            })
                          }
                          className="pressable group mx-auto block rounded p-1 text-border-strong hover:text-muted-foreground max-sm:inline-flex max-sm:h-11 max-sm:w-11 max-sm:items-center max-sm:justify-center"
                          aria-label={`${s.name}, ${d.weekday} ${d.day} ${d.month}: ${boxLabel(state)}. Change this box.`}
                        >
                          <BoxGlyph state={state} className="h-5 w-5" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    {st ? (
                      <>
                        <span className="text-[13px] font-semibold text-foreground">
                          {st.pct}%
                        </span>
                        <span className="block text-[10px] text-muted">
                          {st.marked} marked
                          {st.excused > 0 ? `, ${st.excused} excused` : ""}
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] text-muted">nothing yet</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <BoxChooser
          anchor={open.anchor}
          state={
            open.bulk
              ? { fill: null, excused: false }
              : cells[open.key] ?? { fill: null, excused: false }
          }
          heading={
            open.bulk
              ? "Mark the whole class"
              : `Mark ${students.find((s) => s.matric === open.key.split("|")[1])?.name ?? ""}`
          }
          onClose={() => setOpen(null)}
          onPick={(next) => {
            if (open.bulk) {
              markWholeClass(open.iso, next);
            } else {
              mark(open.iso, open.key.split("|")[1], next);
            }
            setOpen(null);
          }}
        />
      )}
    </>
  );
}

/**
 * The chooser.
 *
 * It is rendered into the document body rather than into the cell, because
 * the table scrolls sideways and a panel inside a cell would be cut off by
 * the scroll container.
 */
function BoxChooser({
  anchor,
  state,
  heading,
  onPick,
  onClose,
}: {
  anchor: DOMRect;
  state: BoxState;
  heading: string;
  onPick: (next: BoxState) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const width = 236;
    const height = 268;
    let top = anchor.bottom + 8;
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, anchor.top - height - 8);
    }
    const left = Math.min(
      Math.max(8, anchor.left - width / 2 + anchor.width / 2),
      window.innerWidth - width - 8
    );
    setPos({ top, left });
  }, [anchor]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onDown(e: MouseEvent) {
      if (panel.current && !panel.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={heading}
      className="fixed z-50 w-[236px] rounded-lg border border-border-strong bg-surface-raised p-2 shadow-lift"
      style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
    >
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {heading}
      </p>
      <div className="flex flex-col gap-0.5">
        {BOX_CHOICES.map((choice) => {
          const current =
            choice.state.fill === state.fill &&
            choice.state.excused === state.excused;
          return (
            <button
              key={choice.label}
              type="button"
              onClick={() => onPick(choice.state)}
              className={
                "pressable flex items-center gap-2.5 rounded px-2 py-1.5 text-left max-sm:min-h-11 " +
                (current
                  ? "bg-surface-hover text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")
              }
            >
              <BoxGlyph
                state={choice.state}
                className="h-4 w-4 shrink-0 text-foreground"
              />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium leading-tight">
                  {choice.label}
                </span>
                <span className="block text-[10.5px] leading-tight text-muted">
                  {choice.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
