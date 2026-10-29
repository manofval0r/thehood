import { describe, expect, it } from "vitest";
import {
  filterBulletinItems,
  pickLeadBulletinItem,
  whatsAppShareUrl,
} from "@/lib/bulletin-ui";
import type { BulletinItem } from "@/lib/bulletin-types";

const NOW = Date.parse("2026-10-28T09:30:00.000Z");

function item(partial: Partial<BulletinItem>): BulletinItem {
  return {
    id: "item",
    title: "Item",
    body: "Details",
    kind: "notice",
    source: "admin",
    status: "published",
    course: null,
    startsAt: null,
    endsAt: null,
    location: null,
    hasMeeting: false,
    pinned: false,
    urgent: false,
    rsvpEnabled: false,
    expiresAt: null,
    publishedAt: "2026-10-28T08:00:00.000Z",
    sourceUpdatedAt: null,
    sourceLabel: "Staff bulletin",
    canonicalHref: "/#bulletin-item",
    ...partial,
  };
}

describe("filterBulletinItems", () => {
  const items = [
    item({ id: "class", kind: "class", startsAt: "2026-10-28T10:00:00Z" }),
    item({ id: "event", kind: "event", startsAt: "2026-10-29T10:00:00Z" }),
    item({ id: "deadline", kind: "deadline", startsAt: "2026-10-28T18:00:00Z" }),
  ];

  it("filters by operational group and Lagos calendar day", () => {
    expect(filterBulletinItems(items, "classes", NOW).map((x) => x.id)).toEqual(["class"]);
    expect(filterBulletinItems(items, "events", NOW).map((x) => x.id)).toEqual(["event"]);
    expect(filterBulletinItems(items, "today", NOW).map((x) => x.id)).toEqual([
      "class",
      "deadline",
    ]);
  });
});

describe("pickLeadBulletinItem", () => {
  it("prefers a live class, then the nearest upcoming class", () => {
    const live = item({
      id: "live",
      kind: "class",
      startsAt: "2026-10-28T09:00:00Z",
      endsAt: "2026-10-28T10:00:00Z",
    });
    const upcoming = item({
      id: "next",
      kind: "class",
      startsAt: "2026-10-28T11:00:00Z",
      endsAt: "2026-10-28T12:00:00Z",
    });
    expect(pickLeadBulletinItem([upcoming, live], NOW)?.id).toBe("live");
    expect(pickLeadBulletinItem([upcoming], NOW)?.id).toBe("next");
  });
});

describe("whatsAppShareUrl", () => {
  it("shares concise text with the canonical site anchor", () => {
    const url = whatsAppShareUrl(
      item({ id: "cancelled", title: "CYB 305 is cancelled", course: "CYB 305", canonicalHref: "/#bulletin-cancelled" }),
      "https://nutmcybersecurity.vercel.app"
    );
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://wa.me/");
    expect(parsed.searchParams.get("text")).toBe(
      "CYB 305 is cancelled · CYB 305\nhttps://nutmcybersecurity.vercel.app/#bulletin-cancelled"
    );
  });
});
