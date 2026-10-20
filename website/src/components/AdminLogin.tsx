"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

/**
 * The way in.
 *
 * One code, shared by the department. There are no accounts and no names,
 * because there is nobody to name: the person filling a box is whoever is
 * standing in front of the screen on that day.
 */
export function AdminLogin() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <form action={formAction} className="mt-8 max-w-sm">
      <label
        htmlFor="secret"
        className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Staff code
      </label>
      <input
        id="secret"
        name="secret"
        type="password"
        autoComplete="current-password"
        required
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent"
        placeholder="The code the department was given"
      />

      {state.error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-foreground">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="pressable mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Checking" : "Open the staff area"}
      </button>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        Five wrong guesses from the same address locks that address out for
        fifteen minutes.
      </p>
    </form>
  );
}
