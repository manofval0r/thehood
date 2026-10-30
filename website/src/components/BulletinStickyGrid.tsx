"use client";

import type { BulletinItem } from "@/lib/bulletin-types";
import { noteTone, useBulletinPalette } from "@/components/BulletinPalette";
import { cn } from "@/lib/utils";

/**
 * A flat sticky grid for phones and for desktops where WebGL is not
 * available. Same deterministic order as the 3D board (top-left first) and
 * the same kind label, so a reader on any device sees the same truth.
 *
 * Notes are the site's own surface, not paper: no cork, no warm browns,
 * just the tokens, a thin tone edge, and a label that names the kind because
 * colour is never the only signal.
 */

function kindLabel(item: BulletinItem): string {
  if (item.urgent || item.kind === "alert") return "Urgent";
  return item.kind;
}

export default function BulletinStickyGrid({
  items,
  onSelect,
}: {
  items: BulletinItem[];
  onSelect: (item: BulletinItem) => void;
}) {
  const palette = useBulletinPalette();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const tone = palette ? noteTone(item, palette) : "transparent";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "pressable relative min-h-24 rounded-lg border border-border bg-surface p-3 text-left",
              "hover:border-border-strong hover:bg-surface-hover"
            )}
            aria-label={`${item.title || "Update"}, ${kindLabel(item)}`}
          >
            <span
              className="pointer-events-none absolute inset-y-2 left-2 w-[3px] rounded-full"
              style={{ backgroundColor: tone }}
              aria-hidden="true"
            />
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {kindLabel(item)}
            </span>
            <span className="mt-1.5 block text-[13px] font-semibold leading-snug text-foreground">
              {item.title || "Update"}
            </span>
            {item.startsAt && (
              <span className="mt-1 block text-[11px] text-muted">
                {new Date(item.startsAt).toLocaleDateString("en-GB", {
                  timeZone: "Africa/Lagos",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
