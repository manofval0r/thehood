"use client";

import * as React from "react";
import { useSharedTick, studentId } from "@/hooks/useAssessments";
import {
  upcomingAssignments,
  type Assignment,
  type UpcomingAssignment,
  type AssignmentType,
} from "@/lib/assignments";
import { AssignmentCard } from "@/components/AssignmentCard";
import { AssignmentForm } from "@/components/AssignmentForm";
import { Plus, Filter, Clock, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignmentListProps {
  courses: { code: string; title: string }[];
}

type TypeFilter = "all" | "group" | "individual";
type SortOrder = "dueSoonest" | "dueLatest";

/**
 * The list of course assignments.
 *
 * Fetches all assignments, then ticks them from one shared loop so the
 * countdowns stay in step. Staff create assignments through the form;
 * students see the same list read-only. Filter by type or course, sort by
 * due date.
 */
export function AssignmentList({ courses }: AssignmentListProps) {
  const now = useSharedTick();
  const [assignments, setAssignments] = React.useState<UpcomingAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Assignment | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Filters.
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string | "">("");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("dueSoonest");

  React.useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const res = await fetch("/api/assignments", { cache: "no-store" });
        if (!res.ok) return;
        const rows = (await res.json()) as Assignment[];
        if (live) {
          setAssignments(
            sortAssignments(
              filterAssignments(upcomingAssignments(rows, new Date(now.getTime()))),
              sortOrder
            )
          );
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
  }, [now, typeFilter, courseFilter, sortOrder]);

  const filtered = React.useMemo(() => {
    return assignments.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (courseFilter && a.course_code !== courseFilter) return false;
      return true;
    });
  }, [assignments, typeFilter, courseFilter]);

  const create = async (data: {
    courseCode: string;
    courseTitle: string;
    title: string;
    type: AssignmentType;
    dueAt: string;
    submitMethod: "email" | "presentation" | "inperson" | "other";
    submitDetail: string;
    notes: string;
    eventTitle: string;
    eventAt: string | null;
    notificationFrequency: "once" | "biweekly";
    resources: { type: "youtube" | "upload"; url: string; title: string }[];
    reminders: { offset_hours: number }[];
  }) => {
    setBusy(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = (await res.json()) as Assignment;
      const createdUpcoming = upcomingAssignments([created], new Date(now.getTime()))[0];
      setAssignments((prev) =>
        sortAssignments(
          filterAssignments([...prev, createdUpcoming]),
          sortOrder
        )
      );
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const update = async (data: {
    id: string;
    courseCode: string;
    courseTitle: string;
    title: string;
    type: AssignmentType;
    dueAt: string;
    submitMethod: "email" | "presentation" | "inperson" | "other";
    submitDetail: string;
    notes: string;
    eventTitle: string;
    eventAt: string | null;
    notificationFrequency: "once" | "biweekly";
    resources: { type: "youtube" | "upload"; url: string; title: string }[];
    reminders: { offset_hours: number }[];
  }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(data.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      setAssignments((prev) =>
        sortAssignments(
          filterAssignments(
            prev.map((a) =>
              a.id === data.id
                ? upcomingAssignments(
                    [{ ...a, title: data.title, type: data.type, dueAt: data.dueAt } as Assignment],
                    new Date(now.getTime())
                  )[0]
                : a
            )
          ),
          sortOrder
        )
      );
      setEditing(null);
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <span className="text-[12px] text-muted">Loading assignments</span>
      </div>
    );
  }

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "group", label: "Group" },
    { value: "individual", label: "Individual" },
  ];

  return (
    <div className="space-y-6">
      {/* Header: title + add button. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Assignments
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Course assignments with countdowns, resources and reminders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={busy}
          className={cn(
            "pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none max-sm:min-h-11"
          )}
        >
          <Plus size={16} /> {assignments.length === 0 ? "Add your first" : "Add assignment"}
        </button>
      </div>

      {/* Filters + sort. */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:items-end">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((o) => {
            const active = typeFilter === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setTypeFilter(o.value)}
                className={cn(
                  "pressable inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors max-sm:min-h-11",
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                <Filter size={13} className="shrink-0" />
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Sort
          </label>
          <button
            type="button"
            onClick={() =>
              setSortOrder(sortOrder === "dueSoonest" ? "dueLatest" : "dueSoonest")
            }
            className={cn(
              "pressable inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-[11.5px] text-foreground transition-colors hover:bg-surface-hover max-sm:min-h-11"
            )}
          >
            {sortOrder === "dueSoonest" ? "Due soonest" : "Due latest"} <ArrowUpDown size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Course
          </label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-[13px] text-muted-foreground">
            No assignments match your filters.
          </p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <li key={a.id}>
            <AssignmentCard
              assessment={a}
              now={now}
              onDelete={remove}
              onEdit={(a) => {
                setEditing(a);
                setFormOpen(true);
              }}
              onToggleDone={(id, done) => {
                setBusy(true);
                fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ done }),
                })
                  .then(() => {
                    setAssignments((prev) =>
                      prev.map((x) =>
                        x.id === id ? { ...x, done } : x
                      )
                    );
                  })
                  .finally(() => setBusy(false));
              }}
            />
          </li>
        ))}
      </ul>

      {formOpen && (
        <AssignmentForm
          assessment={editing
            ? {
                id: editing.id,
                course_code: editing.course_code,
                course_title: editing.course_title,
                title: editing.title,
                type: editing.type,
                due_at: editing.due_at,
                submit_method: editing.submit_method,
                submit_detail: editing.submit_detail,
                notes: editing.notes,
                event_title: editing.event_title,
                event_at: editing.event_at,
                notification_frequency: editing.notification_frequency,
                resources: editing.resources ?? [],
                reminders: editing.reminders ?? [],
              }
            : undefined}
          courses={courses}
          onSubmit={editing
            ? (data) => update({ ...data, id: editing.id })
            : create}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          busy={busy}
        />
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

function filterAssignments(assignments: UpcomingAssignment[]): UpcomingAssignment[] {
  return assignments;
}
