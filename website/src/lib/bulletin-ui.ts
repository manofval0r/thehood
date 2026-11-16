import type { BulletinItem } from "@/lib/bulletin-types";
import { lagosDay } from "@/lib/session-dates";

export type BulletinFilter =
  | "all"
  | "today"
  | "classes"
  | "deadlines"
  | "events"
  | "notices";

export type BulletinSectionKey =
  | "alerts"
  | "classes"
  | "deadlines"
  | "events"
  | "notices"
  | "other";

export interface BulletinGroup {
  key: BulletinSectionKey;
  label: string;
  items: BulletinItem[];
}

/**
 * The same items the flat feed shows, organised so a reader can tell what
 * needs them now from what can wait. Order within each group is the feed's
 * own order — pinned, urgent, live, then chronological.
 */
export function groupBulletinItems(items: BulletinItem[]): BulletinGroup[] {
  const groups: BulletinGroup[] = [
    { key: "alerts", label: "Needs you now", items: [] },
    { key: "classes", label: "Classes", items: [] },
    { key: "deadlines", label: "Deadlines", items: [] },
    { key: "events", label: "Events", items: [] },
    { key: "notices", label: "Notices", items: [] },
    { key: "other", label: "More", items: [] },
  ];
  for (const item of items) {
    if (item.kind === "alert" || item.urgent) groups[0].items.push(item);
    else if (item.kind === "class") groups[1].items.push(item);
    else if (item.kind === "deadline") groups[2].items.push(item);
    else if (item.kind === "event") groups[3].items.push(item);
    else if (item.kind === "notice" || item.kind === "resource") groups[4].items.push(item);
    else groups[5].items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

/** One colour per kind, shared by the 2D legend and the 3D pins. */
export const KIND_TONES: { kind: string; label: string; tone: string }[] = [
  { kind: "class", label: "Classes", tone: "var(--tone-academic)" },
  { kind: "deadline", label: "Deadlines", tone: "var(--tone-exams)" },
  { kind: "event", label: "Events", tone: "var(--tone-ceremony)" },
  { kind: "notice", label: "Notices", tone: "var(--tone-statutory)" },
];

export function filterBulletinItems(
  items: BulletinItem[],
  filter: BulletinFilter,
  now = Date.now()
): BulletinItem[] {
  if (filter === "all") return items;
  if (filter === "classes") {
    return items.filter((item) => item.kind === "class" || item.kind === "alert");
  }
  if (filter === "deadlines") {
    return items.filter((item) => item.kind === "deadline");
  }
  if (filter === "events") {
    return items.filter((item) => item.kind === "event");
  }
  if (filter === "notices") {
    return items.filter(
      (item) => item.kind === "notice" || item.kind === "resource"
    );
  }
  const today = lagosDay(new Date(now));
  return items.filter(
    (item) => item.startsAt && lagosDay(new Date(item.startsAt)) === today
  );
}

export function pickLeadBulletinItem(
  items: BulletinItem[],
  now = Date.now()
): BulletinItem | null {
  const classes = items.filter(
    (item) =>
      item.kind === "class" &&
      item.startsAt &&
      item.endsAt &&
      Number.isFinite(Date.parse(item.startsAt)) &&
      Number.isFinite(Date.parse(item.endsAt))
  );
  const live = classes.find(
    (item) =>
      Date.parse(item.startsAt as string) <= now &&
      now < Date.parse(item.endsAt as string)
  );
  if (live) return live;
  return (
    classes
      .filter((item) => Date.parse(item.startsAt as string) > now)
      .sort(
        (a, b) =>
          Date.parse(a.startsAt as string) - Date.parse(b.startsAt as string)
      )[0] ?? null
  );
}

export function whatsAppShareUrl(
  item: BulletinItem,
  origin: string
): string {
  const context = item.course ? ` · ${item.course}` : "";
  const href = new URL(item.canonicalHref, origin).toString();
  return `https://wa.me/?${new URLSearchParams({
    text: `${item.title}${context}\n${href}`,
  }).toString()}`;
}
