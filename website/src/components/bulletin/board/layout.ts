/**
 * Deterministic placement of notes on the board.
 *
 * The feed arrives already sorted (pinned, urgent, live, then chronological;
 * see sortBulletinItems in lib/bulletin-domain.ts). The board must not throw
 * that order away. Notes are placed top-left first, row by row, which is the
 * same reading order as the 2D list, so the two views stay in one order.
 *
 * Placement is a pure function of the note's index and id. It never touches
 * Math.random, because randomness in render means the same feed lands in
 * different places on a re-render and breaks any test of the layout.
 */

import type { BulletinItem } from "@/lib/bulletin-types";

export const NOTE_W = 1.55;
export const NOTE_H = 1.02;
export const NOTE_GAP = 0.42;
export const ROW_PITCH = 1.62;
export const COLUMNS = 3;
export const BOARD_TOP = 2.6;

export interface PlacedNote {
  item: BulletinItem;
  x: number;
  y: number;
  tilt: number;
}

/** A small stable wobble per note, derived from its id, clamped to +/- 4 deg. */
function noteTilt(id: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const unit = ((hash ^ index * 7919) & 0x7fffffff) / 0x7fffffff;
  return (unit - 0.5) * 0.14; // -0.07 .. 0.07 rad
}

export function placeNotes(items: BulletinItem[]): PlacedNote[] {
  const cellW = NOTE_W + NOTE_GAP;
  const left = -((COLUMNS - 1) * cellW) / 2;
  return items.map((item, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return {
      item,
      x: left + column * cellW,
      y: BOARD_TOP - row * ROW_PITCH,
      tilt: noteTilt(item.id, index),
    };
  });
}

/** Number of rows the given count of notes occupies. */
export function noteRows(count: number): number {
  if (count <= 0) return 0;
  return Math.ceil(count / COLUMNS);
}
