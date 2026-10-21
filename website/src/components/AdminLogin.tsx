"use client";

import { useActionState, useEffect } from "react";
import { login, type LoginState } from "@/app/admin/actions";

/**
 * The way in.
 *
 * A name and a code of your own. There are no shared accounts, because a
 * shared account cannot say who did what: an attendance record that says
 * "staff" cannot be argued with, and an argument needs a name.
 */
export function AdminLogin() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  /**
   * Signing in loads the page again.
   *
   * Not a soft refresh. The cookie is set on the server, and the page and
   * the bar are both showing what they showed for somebody who was not
   * signed in; a soft refresh of a partially prerendered page can leave the
   * old tree and the new one on the screen together, and the bar has to be
   * told the session is new anyway. A whole page load is one request with
   * the cookie on it, and the result is the same on every browser.
   */
  useEffect(() => {
    if (!state.ok) return;
    window.location.assign("/admin");
  }, [state.ok]);

  return (
    <form action={formAction} className="mt-8 max-w-sm">
      <label
        htmlFor="name"
        className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Your name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        autoComplete="username"
        required
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground outline-none focus-visible:border-accent"
        placeholder="The name you are on the staff list under"
      />

      <label
        htmlFor="code"
        className="mt-4 block text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Your code
      </label>
      <input
        id="code"
        name="code"
        type="password"
        autoComplete="current-password"
        required
        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-[14px] tracking-[0.12em] text-foreground outline-none focus-visible:border-accent"
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
      />

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
        {pending ? "Checking" : "Open the staff area"}
      </button>

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        Five wrong guesses from the same address locks that address out for
        fifteen minutes. If you have lost your code, ask whoever made it to
        give you a new one.
      </p>
    </form>
  );
}
