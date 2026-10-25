"use client";

import { useActionState, useState } from "react";
import {
  addStaffMember,
  approveStaffMember,
  changePermissions,
  changeRole,
  readStaffCode,
  reissueStaffCode,
  rejectStaffMember,
  reinstateStaffMember,
  removeStaffMember,
  revokeStaffMember,
  type StaffState,
} from "@/app/admin/actions";
import {
  PERMISSIONS,
  PERMISSION_HELP,
  PERMISSION_LABEL,
  type Permission,
} from "@/lib/permissions";

/**
 * The staff list.
 *
 * A super admin sees everybody: who is waiting, who is active, who has
 * been locked out, and every change that has been made. They approve the
 * queue, take access away, and change what somebody may do.
 *
 * An admin sees the people they added, and can add more. What they added
 * does not work until a super admin approves it.
 *
 * The code is shown once, for two days, to the person who added somebody.
 * It is the only time it is readable: after that it is destroyed and has to
 * be reissued.
 */

export interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  role: "super" | "admin";
  status: "pending" | "active" | "revoked" | "rejected";
  permissions: Permission[];
  added_by_name: string | null;
  created_at: string;
  last_seen_at: string | null;
  code_visible_until: string | null;
  revoked_reason: string | null;
}

export interface AuditRow {
  id: number;
  at: string;
  actor_name: string;
  action: string;
  target_name: string | null;
  detail: string | null;
}

const STATUS_LABEL: Record<StaffRow["status"], string> = {
  pending: "Waiting for approval",
  active: "Active",
  revoked: "Access taken away",
  rejected: "Not approved",
};

const ACTION_LABEL: Record<string, string> = {
  requested: "asked for",
  approved: "approved",
  rejected: "turned down",
  revoked: "locked out",
  reinstated: "let back in",
  permissions: "changed the permissions of",
  role: "changed the role of",
  removed: "removed",
  reissued: "issued a new code for",
  uploaded: "added material to",
  folder_uploaded: "added a folder of material to",
  moved_file: "moved a file in",
  created_folder: "created a folder in",
  created_folders: "created folders in",
  moved_folder: "moved a folder in",
  renamed_folder: "renamed a folder in",
  deleted_folder: "deleted a folder in",
  deleted_file: "removed a file from",
  renamed_file: "renamed a file in",
};

function when(iso: string | null): string {
  if (!iso) return "never";
  const then = Date.parse(iso);
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(then).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StaffManager({
  me,
  people,
  pending,
  audit,
  super: isSuperUser,
}: {
  me: { id: string; name: string; role: "super" | "admin" };
  /** Everyone a super admin sees, or the people an admin added. */
  people: StaffRow[];
  /** The review queue. Super admins only. */
  pending: StaffRow[];
  /** The audit log. Super admins only. */
  audit: AuditRow[];
  super: boolean;
}) {
  const [state, formAction, pendingSubmit] = useActionState<StaffState, FormData>(
    addStaffMember,
    {}
  );
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [expired, setExpired] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  async function showCode(id: string) {
    const result = await readStaffCode(id);
    if (result.code) {
      setCodes((c) => ({ ...c, [id]: result.code as string }));
      setExpired((e) => ({ ...e, [id]: false }));
    } else {
      setCodes((c) => ({ ...c, [id]: "" }));
      setExpired((e) => ({ ...e, [id]: true }));
    }
  }

  async function copy(id: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // The code is selectable either way, so a clipboard that refuses is not
      // a dead end.
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        {isSuperUser ? "Everyone on the list" : "The people you added"}
      </h2>
      <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
        {isSuperUser
          ? "Everybody with access, and everybody waiting for it. A mark says who made it, and a code can be taken back from one person without touching anybody else."
          : "People you add wait for a super admin before they can sign in. Once they are approved you get their code, for two days, to pass on."}
      </p>

      {/* ---------- The review queue, super admins only ---------- */}
      {isSuperUser && pending.length > 0 && (
        <div className="mt-6 rounded-lg border border-accent/40 bg-accent/5 p-4">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">
            Waiting for you ({pending.length})
          </h3>
          <ul className="mt-3 space-y-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-foreground">
                    {p.name}
                    {p.added_by_name && (
                      <span className="ml-2 text-[11.5px] text-muted">
                        added by {p.added_by_name}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11.5px] text-muted">
                    {p.email ? `${p.email} · ` : ""}
                    {p.permissions.length
                      ? p.permissions.map((x) => PERMISSION_LABEL[x]).join(", ")
                      : "no permissions"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => approveStaffMember(p.id)}
                  className="pressable rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-foreground max-sm:min-h-11 max-sm:px-4"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => rejectStaffMember(p.id)}
                  className="pressable rounded-md border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground max-sm:min-h-11 max-sm:px-4"
                >
                  Say no
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Add somebody ---------- */}
      <form action={formAction} className="mt-6 max-w-2xl">
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
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
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
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent max-sm:min-h-11 max-sm:text-base"
              placeholder="Optional"
            />
          </div>

          {isSuperUser && (
            <div>
              <p className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                Super admin
              </p>
              <label className="mt-2 flex cursor-pointer items-center gap-2 max-sm:min-h-11">
                <input
                  id="staff-super"
                  name="role"
                  type="checkbox"
                  value="super"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  <span className="block font-medium text-foreground">
                    Make them a super admin
                  </span>
                  <span className="block text-[11px] text-muted">
                    Super admins can approve staff, change any role, and send
                    announcements to everybody. Off by default.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>

        <fieldset className="mt-4">
          <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
            What they may do
          </legend>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label
                key={p}
                className="flex items-start gap-2 text-[12.5px] text-muted-foreground max-sm:min-h-11"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={p}
                  defaultChecked={p === "attendance"}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  <span className="block font-medium text-foreground">
                    {PERMISSION_LABEL[p]}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {PERMISSION_HELP[p]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.error ? (
          <p role="alert" className="mt-3 text-[12.5px] text-foreground">
            {state.error}
          </p>
        ) : null}
        {state.name && !state.error ? (
          <p className="mt-3 text-[12.5px] text-accent">
            {state.name} has been added to the queue. A super admin has to
            approve them before they can sign in.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pendingSubmit}
          className="pressable mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60 max-sm:min-h-11 max-sm:text-base"
        >
          {pendingSubmit ? "Adding" : "Add them"}
        </button>
      </form>

      {/* ---------- The people ---------- */}
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {people.map((p) => {
          const isMe = p.id === me.id;
          const code = codes[p.id];
          const codeGone = expired[p.id];
          const windowLeft = p.code_visible_until
            ? new Date(p.code_visible_until).getTime() - Date.now()
            : 0;
          return (
            <li key={p.id} className="py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-foreground">
                    {p.name}
                    {isMe && (
                      <span className="ml-2 text-[11px] text-accent">that is you</span>
                    )}
                    {p.role === "super" && (
                      <span className="ml-2 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-accent">
                        super admin
                      </span>
                    )}
                  </span>
                  <span className="block text-[11.5px] text-muted">
                    {p.email ? `${p.email} · ` : ""}
                    {STATUS_LABEL[p.status]}
                    {p.added_by_name ? ` · added by ${p.added_by_name}` : ""}
                    {p.last_seen_at ? ` · last seen ${when(p.last_seen_at)}` : ""}
                  </span>
                </span>

                {p.status === "active" && (
                  <button
                    type="button"
                    onClick={() => showCode(p.id)}
                    className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                  >
                    {code ? "Hide the code" : "Show the code"}
                  </button>
                )}

                {isSuperUser && !isMe && (
                  <>
                    {p.status === "active" && (
                      <button
                        type="button"
                        onClick={() => revokeStaffMember(p.id)}
                        className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                      >
                        Lock out
                      </button>
                    )}
                    {p.status === "revoked" && (
                      <button
                        type="button"
                        onClick={() => reinstateStaffMember(p.id)}
                        className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                      >
                        Let back in
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => reissueStaffCode(p.id)}
                      className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                    >
                      New code
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        changeRole(p.id, p.role === "super" ? "admin" : "super")
                      }
                      className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                    >
                      {p.role === "super" ? "Make an admin" : "Make a super admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStaffMember(p.id)}
                      className="pressable shrink-0 rounded px-2 py-1 text-[11.5px] text-muted hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>

              {/* The code. Shown once, for two days, to the person who added
                  them. After that it is gone and has to be reissued. */}
              {code && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <code className="select-all rounded border border-border bg-surface px-3 py-2 font-mono text-[14px] tracking-[0.12em] text-accent">
                    {code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(p.id, code)}
                    className="pressable rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11 max-sm:px-4"
                  >
                    {copied === p.id ? "Copied" : "Copy"}
                  </button>
                  <span className="text-[11.5px] text-muted">
                    {windowLeft > 0
                      ? `This code disappears in ${Math.ceil(windowLeft / 3600000)} hours.`
                      : "This code is about to disappear."}
                  </span>
                </div>
              )}
              {codeGone && (
                <p className="mt-2 text-[12px] text-muted">
                  That code has expired and cannot be read again. Issue a new
                  one if it needs to be passed on.
                </p>
              )}

              {/* Permissions, super admins only. */}
              {isSuperUser && !isMe && (
                <PermissionEditor person={p} />
              )}
            </li>
          );
        })}
      </ul>

      {/* ---------- The audit log, super admins only ---------- */}
      {isSuperUser && (
        <div className="mt-10">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
            The audit log
          </h3>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Every change to anybody's access, who made it and when.
          </p>
          {audit.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              Nothing has been changed yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {audit.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-[12.5px]"
                >
                  <span className="font-medium text-foreground">{a.actor_name}</span>
                  <span className="text-muted">
                    {ACTION_LABEL[a.action] ?? a.action}
                  </span>
                  {a.target_name && (
                    <span className="font-medium text-foreground">
                      {a.target_name}
                    </span>
                  )}
                  {a.detail && <span className="text-muted">({a.detail})</span>}
                  <span className="ml-auto text-[11.5px] text-muted">
                    {new Date(a.at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** What one person may do, editable by a super admin. */
function PermissionEditor({ person }: { person: StaffRow }) {
  const [chosen, setChosen] = useState<Permission[]>(person.permissions);
  const dirty =
    chosen.length !== person.permissions.length ||
    chosen.some((p) => !person.permissions.includes(p));

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap gap-2">
        {PERMISSIONS.map((p) => {
          const on = chosen.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() =>
                setChosen((c) =>
                  on ? c.filter((x) => x !== p) : [...c, p]
                )
              }
              aria-pressed={on}
              className={
                "pressable rounded-full border px-2.5 py-1 text-[11.5px] max-sm:min-h-11 max-sm:px-3 " +
                (on
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border text-muted hover:text-foreground")
              }
            >
              {PERMISSION_LABEL[p]}
            </button>
          );
        })}
      </div>
      {dirty && (
        <button
          type="button"
          onClick={() => changePermissions(person.id, chosen)}
          className="pressable rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:border-border-strong hover:bg-surface-hover max-sm:min-h-11 max-sm:px-3"
        >
          Save
        </button>
      )}
    </div>
  );
}
