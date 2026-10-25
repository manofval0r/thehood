"use client";

import * as React from "react";
import { useSharedTick, studentId } from "@/hooks/useAssessments";
import {
  upcomingAssessments,
  type Assessment,
  type UpcomingAssessment,
} from "@/lib/assessments";
import { AssessmentCard } from "@/components/AssessmentCard";
import { AssessmentForm } from "@/components/AssessmentForm";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentListProps {
  courses: { code: string; title: string }[];
}

/**
 * The list of assessments.
 *
 * Fetches this device's assessments, then ticks them all from one shared
 * loop so the countdowns stay in step. New assessments are created through
 * the form; deleting goes to the API route.
 */
export function AssessmentList({ courses }: AssessmentListProps) {
  const now = useSharedTick();
  const [assessments, setAssessments] = React.useState<UpcomingAssessment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<{
    id: string;
    course_code: string;
    title: string;
    type: "exam" | "test" | "assignment";
    dueAt: string;
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const sid = studentId();

  React.useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/assessments?student_id=${encodeURIComponent(sid)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const rows = (await res.json()) as Assessment[];
        if (live) {
          setAssessments(upcomingAssessments(rows, new Date(now.getTime())));
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
  }, [sid]);

  const create = async (data: {
    courseCode: string;
    title: string;
    type: "exam" | "test" | "assignment";
    dueAt: string;
    reminders: { offset_hours: number; channel: string }[];
  }) => {
    setBusy(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: data.courseCode,
          title: data.title,
          type: data.type,
          dueAt: data.dueAt,
          studentId: sid,
          reminders: data.reminders,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = (await res.json()) as Assessment;
      setAssessments((prev) =>
        upcomingAssessments([...prev, created], new Date(now.getTime()))
      );
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const update = async (data: {
    id: string;
    courseCode: string;
    title: string;
    type: "exam" | "test" | "assignment";
    dueAt: string;
    reminders: { offset_hours: number; channel: string }[];
  }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/assessments?id=${encodeURIComponent(data.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: data.courseCode,
          title: data.title,
          type: data.type,
          dueAt: data.dueAt,
          studentId: sid,
          reminders: data.reminders,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setAssessments((prev) =>
        upcomingAssessments(
          prev.map((a) =>
            a.id === data.id
              ? { ...a, title: data.title, type: data.type, dueAt: data.dueAt }
              : a
          ),
          new Date(now.getTime())
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
      const res = await fetch(`/api/assessments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <span className="text-[12px] text-muted">Loading assessments</span>
      </div>
    );
  }

  const hasCourses = courses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header: count + add button. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Assessments
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Track your tests, exams and assignments. Countdowns update live
            and reminders can nudge you before each one.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={!hasCourses || busy}
          className={cn(
            "pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:pointer-events-none max-sm:min-h-11",
            !hasCourses ? "opacity-50" : ""
          )}
        >
          <Plus size={16} /> {assessments.length === 0 ? "Add your first" : "Add assessment"}
        </button>
      </div>

      {assessments.length === 0 && hasCourses && (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-[13px] text-muted-foreground">
            No assessments yet. Add an exam, test or assignment to start
            counting down.
          </p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => (
          <li key={a.id}>
            <AssessmentCard
              assessment={{
                id: a.id,
                course_code: a.course_code,
                title: a.title,
                type: a.type,
                due_at: a.due_at,
                student_id: a.student_id,
                created_at: a.created_at,
                updated_at: a.updated_at,
              }}
              now={now}
              onDelete={remove}
              onEdit={(a) => {
                setEditing({
                  id: a.id,
                  course_code: a.course_code,
                  title: a.title,
                  type: a.type,
                  dueAt: a.due_at,
                });
                setFormOpen(true);
              }}
            />
          </li>
        ))}
      </ul>

      {formOpen && (
        <AssessmentForm
          assessment={editing
            ? {
                id: editing.id,
                course_code: editing.course_code,
                title: editing.title,
                type: editing.type,
                dueAt: editing.dueAt,
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
