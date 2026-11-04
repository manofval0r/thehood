"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { setPageEnabled } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import type { PageScope } from "@/lib/pages-settings";

export type PagesScopeRow = { path: string; label: string; off: boolean };

/**
 * The pages the site can show, and the flip to put each one away.
 *
 * Only a super admin. The flip is site-wide: the nav stops naming the
 * page, and a direct visit to its address answers with a redirect. The
 * two public/admin groups are visible on separate mini tabs so the flip
 * list never mixes a student page with a staff page.
 */
export default function PageSwitches({
  publicRows,
  adminRows,
}: {
  publicRows: PagesScopeRow[];
  adminRows: PagesScopeRow[];
}) {
  const [scope, setScope] = useState<PageScope>("admin");
  const rows = scope === "public" ? publicRows : adminRows;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Pages this site shows
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Turn any page off and the nav stops naming it, and a direct visit to its
            address answers with a redirect. A page turned off is not deleted; it is just
            not offered.
          </p>
        </div>

        {/* Mini tab at the top right of the section. */}
        <div
          role="tablist"
          aria-label="Scope"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background p-1"
        >
          {(
            [
              { id: "admin", label: "Staff route" },
              { id: "public", label: "Public route" },
            ] as const
          ).map((tab) => {
            const active = scope === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScope(tab.id)}
                className={cn(
                  "pressable rounded-md px-3 py-2 text-[12px] font-medium transition-colors max-sm:min-h-11 max-sm:px-4",
                  active
                    ? "bg-surface-hover text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <FlipRow key={row.path} row={row} scope={scope} />
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-muted">
        Toggling this writes only to the site’s settings table. A page nobody has turned
        off stays on, and a page that is later turned back on behaves exactly as it did
        before.
      </p>
    </div>
  );
}

function FlipRow({
  row,
  scope,
}: {
  row: PagesScopeRow;
  scope: PageScope;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [on, setOn] = useState(!row.off);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium leading-snug text-foreground">
          {row.label}
        </p>
        <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
          {row.path}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setNote(null);
            try {
              await setPageEnabled(scope, row.path, !on);
              setOn(!on);
            } catch (error) {
              setNote(
                error instanceof Error
                  ? error.message
                  : "It could not be changed."
              );
            } finally {
              setBusy(false);
            }
          }}
          aria-pressed={on}
          className={
            "pressable inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:opacity-50 max-sm:min-h-11 max-sm:px-3 " +
            (on
              ? "border-accent/40 bg-accent/10 text-accent hover:border-accent/60"
              : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
          }
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <span
              aria-hidden="true"
              className={
                "h-2 w-2 rounded-full " +
                (on ? "bg-accent" : "bg-muted-foreground/40")
              }
            />
          )}
          {busy ? "Changing" : on ? "Shown" : "Hidden"}
        </button>
        {note && (
          <span role="status" className="max-w-[15rem] text-right text-[11px] leading-snug text-muted-foreground">
            {note}
          </span>
        )}
      </div>
    </li>
  );
}
