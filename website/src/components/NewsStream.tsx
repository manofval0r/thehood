"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import { beatLabel } from "@/lib/news-kinds";
import type { NewsItem } from "@/lib/news";

/**
 * The live part of the news page.
 *
 * The feed itself is cached server-side for an hour; that part cannot change
 * without a fetch. But the grouping and the "2h ago" stamps are computed
 * against `Date.now()`, which is an unstable value that fails the build when
 * a page is prerendered. Recomputing it here, where the clock is a real
 * clock, also means the labels stay honest while the reader is actually
 * looking, instead of freezing at whatever the last build happened to be.
 */

function timeAgo(ts: number): string {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function groupItems(items: NewsItem[]) {
  const now = Date.now();
  const p = (ts: number) => now - ts;
  const today = items.filter((i) => p(i.published) < 24 * 3600000);
  const yesterday = items.filter(
    (i) => p(i.published) >= 24 * 3600000 && p(i.published) < 48 * 3600000
  );
  const week = items.filter(
    (i) => p(i.published) >= 48 * 3600000 && p(i.published) < 7 * 24 * 3600000
  );
  const earlier = items.filter((i) => p(i.published) >= 7 * 24 * 3600000);
  return [["Today", today], ["Yesterday", yesterday],
    ["This week", week], ["Earlier", earlier]] as [string, NewsItem[]][];
}

export function NewsStream({ items }: { items: NewsItem[] }) {
  // No Date.now() may run until the component is mounted. Next.js prerenders
  // client components during the build, and `Date.now()` in a state initializer
  // is one of the unstable values that fails there. So the groups start empty,
  // a skeleton holds the space in the pristine render, and the real grouping
  // (which is clock-dependent) is only ever computed in effects, on the client.
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState<[string, NewsItem[]][]>([]);

  useEffect(() => {
    setMounted(true);
    setGroups(groupItems(items));
    const onVisible = () => setGroups(groupItems(items));
    document.addEventListener("visibilitychange", onVisible);
    const min = setInterval(() => setGroups(groupItems(items)), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(min);
    };
  }, [items]);

  if (!mounted) {
    // Skeleton: same card skeletons a few times, so the swap over is stable.
    return (
      <div className="mt-12 space-y-8" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
            {[0, 1].map((j) => (
              <div
                key={j}
                className="h-28 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Reveal className="mt-12">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-[15px] font-semibold text-foreground">
            The feeds are unreachable right now
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Every source came back empty on the last refresh. The page will try
            again on the next hourly pass; nothing here is broken on your side.
            The timetable and the resources do not depend on a network of blogs,
            so they are all still available.
          </p>
        </div>
      </Reveal>
    );
  }

  return (
    <>
      {groups.map(
        ([label, list]) =>
          list.length > 0 && (
            <section key={label} className="mt-12">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {label}
              </h2>
              <div className="mt-4 space-y-3">
                {list.map((item) => (
                  <article key={item.id}>
                    <AppleCard maxTilt={4} className="h-full">
                      <Link
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-tilt settle flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover sm:p-5"
                      >
                        <span className="card-cast" aria-hidden="true" />
                        <span className="card-bevel" aria-hidden="true" />

                        <div className="card-depth flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-black">
                            <PixelMotif
                              kind={item.beat}
                              title={beatLabel(item.beat)}
                              className="h-5 w-5"
                            />
                          </span>
                          <span className="min-w-0 text-[12px] text-muted">
                            <span className="font-medium text-foreground">
                              {item.source}
                            </span>
                            <span
                              aria-hidden="true"
                              className="mx-1.5 text-border-strong"
                            >
                              /
                            </span>
                            <span className="capitalize">
                              {beatLabel(item.beat)}
                            </span>
                            <time
                              dateTime={
                                item.published
                                  ? new Date(item.published).toISOString()
                                  : undefined
                              }
                              className="ml-1.5 text-muted"
                            >
                              · {timeAgo(item.published)}
                            </time>
                          </span>
                        </div>

                        <h3 className="card-depth mt-3 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                          {item.title}
                        </h3>

                        {item.summary && (
                          <p className="card-depth mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                            {item.summary}
                          </p>
                        )}

                        <span className="card-depth mt-auto pt-3 text-[12px] font-medium text-accent">
                          Read on {item.home} →
                        </span>
                      </Link>
                    </AppleCard>
                  </article>
                ))}
              </div>
            </section>
          )
      )}
    </>
  );
}
