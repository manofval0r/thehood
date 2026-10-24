"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { login, type LoginState } from "@/app/admin/actions";

/**
 * The way in.
 *
 * A name and a code of your own. There are no shared accounts, because a
 * shared account cannot say who did what: an attendance record that says
 * "staff" cannot be argued with, and an argument needs a name.
 *
 * The form does the work itself rather than using the action state hook,
 * because the page is taken off the screen the moment the action returns.
 * The route is re-rendered with the session on it, so the form is replaced
 * by the page it was protecting, and a component that is not on the screen
 * cannot navigate or run an effect. The navigation is made in the promise
 * that comes back from the action, which is still running after the form
 * has gone.
 */
export function AdminLogin() {
  const [state, setState] = React.useState<LoginState>({});
  const [pending, setPending] = React.useState(false);
  const pathname = usePathname();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);

    /*
     * The action is a network call, so it can reject: a dropped connection, a
     * deployment that is not ready, a database that is not configured. A
     * rejected promise used to leave the button saying "Checking" for ever,
     * which reads as a site that is thinking rather than a site that failed.
     */
    let answer: LoginState;
    try {
      answer = await login(null, form);
    } catch {
      setPending(false);
      setState({
        error:
          "The staff area could not be reached. Check your connection and try again.",
      });
      return;
    }

    if (answer.ok) {
      // The whole page is loaded again, with the cookie on it. The bar is
      // in the layout, and the layout only knows the session once it has
      // been told, so a soft refresh would leave a bar showing the
      // student's links to somebody who had just signed in.
      window.location.assign(
        pathname.startsWith("/admin") ? pathname : "/admin"
      );
      return;
    }

    setPending(false);
    setState(answer);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-sm">
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
        className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none focus-visible:border-accent sm:h-10 sm:text-[14px]"
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
        className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 font-mono text-base tracking-[0.12em] text-foreground outline-none focus-visible:border-accent sm:h-10 sm:text-[14px]"
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
        className="pressable mt-4 rounded-md bg-accent px-4 py-2 text-[13.5px] font-semibold text-accent-foreground disabled:opacity-60 max-sm:min-h-11 max-sm:text-base"
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
