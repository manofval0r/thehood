"use client";

import { useActionState, useEffect, useState } from "react";
import {
  addStaffMember,
  removeStaffMember,
  setStaffActive,
  type StaffState,
} from "@/app/admin/actions";

/**
 * The staff list.
 *
 * Each person has their own code. It is shown once, when it is made, and
 * never again, because only a hash of it is kept. There is no way to read
 * somebody's code back, and no way to reset it in place: a lost code means a
 * new code, and the old one stops working.
 *
 * The person signed in can lock someone out without removing them, which
 * keeps their name on the marks they made.
 */

export interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
  last_seen_at: string | null;
}

function when(iso: string | null): string {
  if (!iso) return "never signed in";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (days <= 0) return "signed in today";
  if (days === 1) return "signed in yesterday";
  if (days < 30) return `signed in ${days} days ago`;
  return "signed in a while ago";
}

export function StaffManager({
  staff,
  me,
}: {
  staff: StaffRow[];
  me: string;
}) {
  const [state, formAction, pending] = useActionState<StaffState, FormData>(
    addStaffMember,
    {}
  );
  const [shown, setShown] = useState<{ name: string; code: string } | null>(null);

  // The code comes back from the action, so the panel is opened from an
  // effect rather than from the state initialiser. An initialiser only runs
  // on the first render, and the code arrives on a later one.
  useEffect(() => {
    if (state.code && state.name) {
      setShown({ name: state.name, code: state.code });
    }
  }, [state.code, state.name]);

  return (
    <section className="mt-12">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        Who can get in
      </h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
        Everyone here has their own code. A mark says who made it, and a code
        can be taken back from one person without touching anybody else.
      </p>

      <form action={formAction} className="mt-4 max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="staff-name"
              className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Name
            </label>
            <input
              id="staff-name"
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent"
              placeholder="Dr Segun"
            />
          </div>
          <div>
            <label
              htmlFor="staff-email"
              className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              Email, if there is one
            </label>
            <input
              id="staff-email"
              name="email"
              type="email"
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent"
              placeholder="Optional"
            />
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="mt-3 text-[12.5px] text-foreground">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="pressable mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Making the code" : "Add them"}
        </button>
      </form>

      {shown && (
        <div className="mt-5 rounded-lg border border-accent/40 bg-accent/5 p-4">
          <p className="text-[12.5px] font-semibold text-foreground">
            {shown.name} can now sign in with this code
          </p>
          <p className="mt-2 select-all break-all rounded border border-border bg-surface px-3 py-2 font-mono text-[15px] tracking-[0.1em] text-accent">
            {shown.code}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            It is shown once and cannot be read back, because only a hash of it
            is kept. Give it to them now, over a channel you trust, and put
            it somewhere they can find it again.
          </p>
          <button
            type="button"
            onClick={() => setShown(null)}
            className="pressable mt-3 rounded border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            I have written it down
          </button>
        </div>
      )}

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {staff.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5 text-[13px]">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">
                {m.name}
                {m.id === me && (
                  <span className="ml-2 text-[11px] text-accent">that is you</span>
                )}
              </span>
              <span className="block text-[11.5px] text-muted">
                {m.email ? `${m.email} · ` : ""}
                {when(m.last_seen_at)}
              </span>
            </span>
            {!m.active && (
              <span className="shrink-0 text-[11px] text-muted">locked out</span>
            )}
            <button
              type="button"
              onClick={() => setStaffActive(m.id, !m.active)}
              className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground"
            >
              {m.active ? "Lock out" : "Let back in"}
            </button>
            <button
              type="button"
              onClick={() => removeStaffMember(m.id)}
              className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
