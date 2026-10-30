"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, LayoutGrid, List, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import BulletinItemRow from "@/components/BulletinItemRow";
import BulletinBoardView from "@/components/BulletinBoardView";
import StudentVerifyDialog from "@/components/StudentVerifyDialog";
import type { BulletinFeed } from "@/lib/bulletin-feed";
import {
  filterBulletinItems,
  pickLeadBulletinItem,
  type BulletinFilter,
} from "@/lib/bulletin-ui";
import { cn } from "@/lib/utils";

const FILTERS: { value: BulletinFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "classes", label: "Classes" },
  { value: "deadlines", label: "Deadlines" },
  { value: "events", label: "Events" },
  { value: "notices", label: "Notices" },
];

function time(iso: string | null): string {
  if (!iso) return "Time not posted";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BulletinBoard({
  initialFeed,
  initialVerified,
  fullPage = false,
}: {
  initialFeed: BulletinFeed;
  initialVerified: boolean;
  fullPage?: boolean;
}) {
  const [feed, setFeed] = useState(initialFeed);
  const [filter, setFilter] = useState<BulletinFilter>("all");
  const [verified, setVerified] = useState(initialVerified);
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(() => Date.parse(initialFeed.generatedAt));
  const [view, setView] = useState<"list" | "board">("board");
  const [hideLectures, setHideLectures] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = async () => {
    const response = await fetch(
      `/api/bulletin${feed.archive ? "?archive=1" : ""}`,
      { cache: "no-store" }
    );
    if (response.ok) setFeed((await response.json()) as BulletinFeed);
  };

  const visible = useMemo(
    () => filterBulletinItems(feed.items, filter, now),
    [feed.items, filter, now]
  );
  const displayed = fullPage ? visible : visible.slice(0, 8);
  const boardItems = useMemo(() => {
    let list = displayed;
    if (hideLectures) list = list.filter((item) => item.kind !== "class");
    if (onlineOnly) list = list.filter((item) => !item.location);
    return list;
  }, [displayed, hideLectures, onlineOnly]);
  const lead = useMemo(
    () => pickLeadBulletinItem(feed.items, now),
    [feed.items, now]
  );
  const alert = feed.items.find(
    (item) => item.kind === "alert" || item.urgent
  );
  const health = feed.outlookHealth;

  return (
    <section id="bulletin" className={cn("bulletin-board", fullPage && "bulletin-board-full")}>
      <header className="bulletin-board-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="bulletin-live-dot" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Live campus board
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            The current cohort truth from Outlook, the published timetable,
            staff notices, deadlines, and the academic calendar.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted">
          <span className={cn("bulletin-health", health.status === "ok" && "bulletin-health-ok")}>
            {health.status === "ok"
              ? "Outlook synced"
              : health.status === "stale"
                ? "Outlook sync is stale"
                : health.status === "error"
                  ? "Outlook unavailable"
                  : "Outlook not connected"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Refresh bulletin"
            className="pressable grid h-11 w-11 place-items-center rounded-full border border-border text-muted hover:border-border-strong hover:text-foreground"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <div className="bulletin-command-grid">
        <section className="bulletin-lead-lane">
          <p className="bulletin-lane-label">{lead ? (lead.startsAt && Date.parse(lead.startsAt) <= now ? "Happening now" : "Next class") : "Class signal"}</p>
          {lead ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {lead.course && <span className="font-mono text-[11px] font-semibold text-accent">{lead.course}</span>}
                <span className="bulletin-source">{lead.sourceLabel}</span>
              </div>
              <h3 className="mt-2 max-w-xl text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-3xl">
                {lead.title}
              </h3>
              <p className="mt-2 text-[13px] text-muted-foreground">{time(lead.startsAt)}</p>
              <p className="mt-3 max-w-[65ch] text-[13px] leading-relaxed text-muted-foreground">{lead.body}</p>
              <a href={`#bulletin-${lead.id}`} className="pressable mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-[12px] font-medium text-foreground hover:border-accent">
                View class details <ArrowRight size={14} />
              </a>
            </>
          ) : (
            <div className="mt-4">
              <p className="text-[15px] font-semibold text-foreground">No class is currently in range.</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">The published timetable, Outlook, and active overrides were checked.</p>
            </div>
          )}
        </section>

        <section className={cn("bulletin-alert-lane", alert && "bulletin-alert-lane-active")}>
          <p className="bulletin-lane-label">Priority channel</p>
          {alert ? (
            <>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-red-400">Action required</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{alert.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{alert.body}</p>
              <a href={`#bulletin-${alert.id}`} className="pressable mt-4 inline-flex min-h-11 items-center gap-2 text-[12px] font-medium text-accent underline underline-offset-4">Read the update <ArrowRight size={13} /></a>
            </>
          ) : (
            <>
              <p className="mt-3 text-[15px] font-semibold text-foreground">No active disruption</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">No cancellation, urgent venue change, or pinned warning is active.</p>
            </>
          )}
        </section>
      </div>

      <div className="bulletin-feed-header">
        <div role="tablist" aria-label="Filter bulletin" className="flex flex-wrap gap-1.5">
          {FILTERS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={filter === entry.value}
              onClick={() => setFilter(entry.value)}
              className={cn(
                "pressable min-h-11 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                filter === entry.value
                  ? "border-accent bg-accent/12 text-accent"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Bulletin view" className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                view === "list"
                  ? "border-accent bg-accent/12 text-accent"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              <List size={13} /> List
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              className={cn(
                "pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                view === "board"
                  ? "border-accent bg-accent/12 text-accent"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              <LayoutGrid size={13} /> Board
            </button>
            {view === "board" && (
              <>
                <button
                  type="button"
                  onClick={() => setHideLectures((on) => !on)}
                  aria-pressed={hideLectures}
                  className={cn(
                    "pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                    hideLectures
                      ? "border-accent bg-accent/12 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/60"
                  )}
                >
                  Hide lectures
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineOnly((on) => !on)}
                  aria-pressed={onlineOnly}
                  className={cn(
                    "pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                    onlineOnly
                      ? "border-accent bg-accent/12 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/60"
                  )}
                >
                  Online only
                </button>
              </>
            )}
          </div>
            {!verified && (
            <button type="button" onClick={() => setVerifying(true)} className="pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-[11.5px] text-muted-foreground hover:border-accent hover:text-foreground">
              <ShieldCheck size={14} /> Verify this device
            </button>
          )}
          <Link href={feed.archive ? "/bulletin" : "/bulletin?view=archive"} className="pressable inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[11.5px] text-muted-foreground hover:bg-surface-hover hover:text-foreground">
            <Archive size={14} /> {feed.archive ? "Active board" : "Past updates"}
          </Link>
        </div>
      </div>
      <div className="bulletin-feed" role="tabpanel">
        {view === "board" ? (
          <BulletinBoardView
            items={boardItems}
            verified={verified}
            onVerify={() => setVerifying(true)}
            onRefresh={refresh}
          />
        ) : displayed.length > 0 ? (
          displayed.map((item) => (
            <BulletinItemRow
              key={item.id}
              item={item}
              verified={verified}
              onVerify={() => setVerifying(true)}
              onRefresh={refresh}
            />
          ))
        ) : (
          <div className="px-4 py-10 text-center sm:px-6">
            <Radio size={20} className="mx-auto text-muted" />
            <p className="mt-3 text-[14px] font-medium text-foreground">No items match this channel.</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">The active sources were checked at {new Date(feed.generatedAt).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" })}.</p>
          </div>
        )}
      </div>

      {!fullPage && view === "list" && visible.length > displayed.length && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 sm:px-5">
          <span className="text-[11.5px] text-muted">
            Showing {displayed.length} of {visible.length} active updates
          </span>
          <Link
            href="/bulletin"
            className="pressable inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[12px] font-medium text-accent hover:bg-accent/10"
          >
            Open the full bulletin <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {verifying && (
        <StudentVerifyDialog
          onClose={() => setVerifying(false)}
          onVerified={() => {
            setVerified(true);
            setVerifying(false);
            void refresh();
          }}
        />
      )}
    </section>
  );
}
