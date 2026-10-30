"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useState } from "react";
import type { BulletinItem } from "@/lib/bulletin-types";
import { noteRows, placeNotes } from "@/components/bulletin/board/layout";
import { useBulletinPalette } from "@/components/BulletinPalette";
import BulletinStickyGrid from "@/components/BulletinStickyGrid";
import BulletinItemRow from "@/components/BulletinItemRow";

/**
 * The board view of the bulletin.
 *
 * It is a view, not a replacement list: the same `visible` items the list
 * shows, sitting on a board. The three.js scene is loaded on demand and only
 * when all three conditions hold: a width at or above md, WebGL present, and
 * no prefers-reduced-motion. Anyone else gets the flat sticky grid, in the
 * same order, with the same kind labels.
 *
 * Selecting a note opens the same item row the list shows, so every action
 * that exists on the list exists on the board: verify, join, RSVP, share.
 */

// ssr: false must live inside a client component; here it can.
const BoardScene = dynamic(() => import("@/components/BulletinScene"), {
  ssr: false,
});

function canUseWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof WebGLRenderingContext === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Whether the 3D board is usable: a desktop width, WebGL present, and no
 * prefers-reduced-motion. This is a one-time capability read, not React
 * state that changes over a session, so it is exposed as a subscription
 * rather than an effect-driven setState.
 *
 * The server skeleton always reports false (no window), and hydration and
 * the server agree, so the initial render matches.
 */
function useBoardCapability(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof window === "undefined") return false;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      return window.innerWidth >= 768 && !reduced.matches && canUseWebGL();
    },
    () => false
  );
}

export default function BulletinBoardView({
  items,
  verified,
  onVerify,
  onRefresh,
}: {
  items: BulletinItem[];
  verified: boolean;
  onVerify: () => void;
  onRefresh: () => Promise<void>;
}) {
  const palette = useBulletinPalette();
  const [selected, setSelected] = useState<BulletinItem | null>(null);
  const show3d = useBoardCapability();

  const placed = placeNotes(items);
  const boardHeight = 20 + noteRows(items.length) * 12;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
      <div className="hidden md:block">
        {show3d && palette ? (
          <div style={{ height: `${boardHeight}rem` }} aria-label="Bulletin board">
            <BoardScene placed={placed} palette={palette} onSelect={setSelected} />
          </div>
        ) : (
          <BulletinStickyGrid items={items} onSelect={setSelected} />
        )}
      </div>

      {/* Phones always get the flat sticky grid, never the canvas. */}
      <div className="md:hidden">
        <BulletinStickyGrid items={items} onSelect={setSelected} />
      </div>

      {items.length === 0 && (
        <div className="px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-foreground">
            No items on the board.
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            The active sources were checked for the current channel.
          </p>
        </div>
      )}

      {selected && (
        <div
          role="dialog"
          aria-label="Note details"
          className="modal-in max-h-[70%] overflow-y-auto rounded-lg border border-border bg-background p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Bulletin detail
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close note details"
              className="pressable grid h-11 w-11 place-items-center rounded-md border border-border text-muted hover:border-border-strong hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <BulletinItemRow
            item={selected}
            verified={verified}
            onVerify={onVerify}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  );
}
