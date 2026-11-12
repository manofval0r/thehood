"use client";

import * as React from "react";
import { useSharedTick } from "@/hooks/useAssessments";
import { useRouter } from "next/navigation";
import {
  upcomingAssignments,
  type Assignment,
  type UpcomingAssignment,
} from "@/lib/assignments";
import { AssignmentCard } from "@/components/AssignmentCard";
import { useStaffSession } from "@/components/StaffSession";
import { Plus, ArrowUpDown, ChevronDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignmentListProps {
  courses: { code: string; title: string }[];
}

type TypeFilter = "all" | "group" | "individual";
type SortOrder = "dueSoonest" | "dueLatest";

/**
 * The list of course assignments.
 *
 * One fetch, then the countdowns are derived from the shared clock: the
 * rows are stored raw and mapped through upcomingAssignments at render, so
 * the day counters stay honest without touching the network. Staff create
 * and edit assignments; students see the same list read-only.
 */
export function AssignmentList({ courses }: AssignmentListProps) {
  const now = useSharedTick();
  const router = useRouter();
  const { session } = useStaffSession();
  const isStaff = session?.isAdmin === true;

  const [rows, setRows] = React.useState<Assignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string | "">("");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("dueSoonest");

  React.useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const res = await fetch("/api/assignments", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Assignment[];
        if (live) {
          setRows(data);
          setLoading(false);
        }
      } catch {
        if (live) setLoading(false);
      }
    };
    void load();
    return () => {
      live = false;
    };
  }, []);

  const assignments: UpcomingAssignment[] = React.useMemo(
    () =>
      sortAssignments(
        upcomingAssignments(rows, new Date(now.getTime())),
        sortOrder
      ),
    [rows, now, sortOrder]
  );

  const filtered = React.useMemo(() => {
    return assignments.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (courseFilter && a.course_code !== courseFilter) return false;
      return true;
    });
  }, [assignments, typeFilter, courseFilter]);

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setRows((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = (id: string, done: boolean) => {
    setBusy(true);
    void fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    })
      .then(() => {
        setRows((prev) => prev.map((a) => (a.id === id ? { ...a, done } : a)));
      })
      .finally(() => setBusy(false));
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-hidden="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
            <div className="h-9 w-44 animate-pulse rounded bg-surface-raised" />
          </div>
          <div className="h-11 w-28 animate-pulse rounded-md bg-surface-raised" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "group", label: "Group" },
    { value: "individual", label: "Individual" },
  ];

  const open = assignments.filter((a) => !a.done).length;

  return (
    <div className="space-y-6">
      {/* Header: console kicker + title + action. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-accent">
            Course work · {open} open
          </p>
          <h2 className="mt-1.5 text-[30px] font-semibold leading-none tracking-tight text-foreground sm:text-[36px]">
            Assignments
          </h2>
        </div>
        {/* Always visible. Students land on the staff-only gate with a
            sign-in link; staff go straight into the form. */}
        <button
          type="button"
          onClick={() => router.push("/assignments/new")}
          disabled={busy}
          className="pressable inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus size={15} aria-hidden="true" strokeWidth={2.6} />
          Add an assignment
        </button>
      </div>

      {/* Filters + sort. Mono chips, console style. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
          {typeOptions.map((o) => {
            const active = typeFilter === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setTypeFilter(o.value)}
                aria-pressed={active}
                className={cn(
                  "pressable inline-flex min-h-11 items-center rounded-md border px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-border text-muted hover:border-border-strong hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex min-h-11 items-center">
            <span className="sr-only">Filter by course</span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="h-11 appearance-none rounded-md border border-border bg-surface pl-3 pr-9 font-mono text-[11px] text-foreground outline-none focus-visible:border-accent"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 text-muted"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setSortOrder(sortOrder === "dueSoonest" ? "dueLatest" : "dueSoonest")
            }
            className="pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-surface-hover"
          >
            {sortOrder === "dueSoonest" ? "Due soonest" : "Due latest"}
            <ArrowUpDown size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <Inbox size={32} className="text-muted" aria-hidden="true" />
          <div>
            <p className="text-[14px] font-semibold text-foreground">Nothing here yet</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              {assignments.length === 0
                ? isStaff
                  ? "No assignments have been set for these courses. The first one is yours to set."
                  : "Nothing has been set for these courses yet. Check back after the next lecture."
                : "No assignments match the filters. Clear the course or the type filter."}
            </p>
          </div>
          {assignments.length === 0 && (
            <button
              type="button"
              onClick={() => router.push("/assignments/new")}
              className="pressable mt-1 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Plus size={15} aria-hidden="true" strokeWidth={2.6} />
              Add an assignment
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <li key={a.id} className="min-w-0">
              <AssignmentCard
                assessment={a}
                now={now}
                onDelete={remove}
                onEdit={(edited) => router.push(`/assignments/new?edit=${edited.id}`)}
                onToggleDone={toggleDone}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function sortAssignments(
  assignments: UpcomingAssignment[],
  order: SortOrder
): UpcomingAssignment[] {
  return [...assignments].sort((a, b) => {
    if (order === "dueSoonest") return a.remainingMs - b.remainingMs;
    return b.remainingMs - a.remainingMs;
  });
}
