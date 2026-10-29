"use client";

import { useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Radio,
  ShieldCheck,
} from "lucide-react";
import type {
  BulletinItem,
  RsvpResponse,
  RsvpSummary,
} from "@/lib/bulletin-types";
import { whatsAppShareUrl } from "@/lib/bulletin-ui";
import { cn } from "@/lib/utils";

function when(iso: string | null): string {
  if (!iso) return "Posted update";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BulletinItemRow({
  item,
  verified,
  onVerify,
  onRefresh,
}: {
  item: BulletinItem;
  verified: boolean;
  onVerify: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [rsvp, setRsvp] = useState<RsvpSummary | undefined>(item.rsvp);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function join() {
    if (!verified) {
      onVerify();
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch(
        `/api/bulletin/${encodeURIComponent(item.id)}/meeting`,
        { cache: "no-store" }
      );
      const result = (await response.json()) as { url?: string; error?: string };
      if (response.status === 401) {
        onVerify();
        return;
      }
      if (!response.ok || !result.url) {
        setProblem(result.error ?? "No meeting link is available yet.");
        return;
      }
      window.location.assign(result.url);
    } catch {
      setProblem("The meeting link could not be opened. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function respond(responseValue: RsvpResponse) {
    if (!verified) {
      onVerify();
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch(
        `/api/bulletin/${encodeURIComponent(item.id)}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: responseValue }),
        }
      );
      if (response.status === 401) {
        onVerify();
        return;
      }
      const result = (await response.json()) as RsvpSummary & { error?: string };
      if (!response.ok) {
        setProblem(result.error ?? "Your response could not be saved.");
        return;
      }
      setRsvp(result);
      await onRefresh();
    } catch {
      setProblem("Your response could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function share() {
    const url = whatsAppShareUrl(item, window.location.origin);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const disruptive = item.kind === "alert" || item.urgent;

  return (
    <article
      id={`bulletin-${item.id}`}
      className={cn(
        "bulletin-row scroll-mt-28",
        disruptive && "bulletin-row-urgent"
      )}
    >
      <div className="bulletin-row-time">
        <span className="bulletin-source">{item.sourceLabel}</span>
        <span className="tnum mt-1 block text-[11px] text-muted">
          {when(item.startsAt ?? item.publishedAt)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {item.course && (
            <span className="font-mono text-[10.5px] font-semibold text-accent">
              {item.course}
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.kind}
          </span>
          {item.pinned && <span className="bulletin-state">Pinned</span>}
          {disruptive && <span className="bulletin-state bulletin-state-alert">Important</span>}
        </div>
        <h3 className="mt-1 text-[14px] font-semibold leading-snug text-foreground">
          {item.title}
        </h3>
        <p className="mt-1 max-w-[68ch] text-[12.5px] leading-relaxed text-muted-foreground">
          {item.body}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {item.location}
            </span>
          )}
          {item.endsAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={12} /> until {when(item.endsAt)}
            </span>
          )}
        </div>
        {problem && (
          <p role="alert" className="mt-2 text-[12px] text-red-400">
            {problem}
          </p>
        )}

        {item.rsvpEnabled && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(
              [
                ["going", "Going"],
                ["unsure", "Not sure"],
                ["not_going", "Not going"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                aria-pressed={rsvp?.mine === value}
                onClick={() => void respond(value)}
                className={cn(
                  "pressable min-h-11 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
                  rsvp?.mine === value
                    ? "border-accent bg-accent/12 text-accent"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
            {rsvp && (
              <span className="text-[11px] text-muted">
                {rsvp.going} going · {rsvp.unsure} not sure · {rsvp.notGoing} not going
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bulletin-row-actions">
        {item.hasMeeting && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void join()}
            className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-3 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"
          >
            {verified ? <Radio size={14} /> : <ShieldCheck size={14} />}
            {verified ? "Join class" : "Verify to join"}
          </button>
        )}
        <button
          type="button"
          onClick={share}
          className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-[12px] text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <MessageCircle size={14} /> Share
        </button>
        {item.source === "outlook" && item.canonicalHref && (
          <a
            href={item.canonicalHref}
            className="sr-only"
          >
            <ExternalLink size={14} /> Canonical bulletin item
          </a>
        )}
      </div>
    </article>
  );
}
