import type { BulletinItem } from "@/lib/bulletin-types";
import { lagosDay } from "@/lib/session-dates";

export type BulletinFilter =
  | "all"
  | "today"
  | "classes"
  | "deadlines"
  | "events"
  | "notices";

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
