/**
 * The attendance box.
 *
 * A box, drawn in pixels, in the site's black, green and white. There is no
 * icon library here and no drawn icon: the state of a mark is the mark.
 *
 *   unmarked  the box, empty. Nobody has entered anything yet.
 *   present   the box, filled.
 *   partial   the box, filled to the level that was marked.
 *   absent    the box with a bright cross through it.
 *   excused   the box with a flat bar across it.
 *
 * The distinction between unmarked and absent is the whole point. An empty
 * box must never read as a verdict, so it is drawn empty and an absent
 * student gets a mark that cannot be mistaken for it.
 */

export interface BoxState {
  /** 0 to 1, or null when nobody has marked it. */
  fill: number | null;
  excused: boolean;
}

export const UNMARKED: BoxState = { fill: null, excused: false };

const GRID = 10;
/** The usable area inside the outline: 8 by 8. */
const INNER = 8;

export function boxLabel(state: BoxState): string {
  if (state.excused) return "Excused";
  if (state.fill === null) return "Not recorded";
  if (state.fill === 0) return "Absent";
  if (state.fill >= 1) return "Present";
  return `${Math.round(state.fill * 100)} percent present`;
}

type Pixel = { x: number; y: number; tone: "outline" | "fill" | "absent" | "excused" };

function pixelsFor(state: BoxState): Pixel[] {
  const seen = new Set<string>();
  const out: Pixel[] = [];

  const put = (x: number, y: number, tone: Pixel["tone"]) => {
    const key = `${x},${y}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ x, y, tone });
  };

  // The box itself is always there.
  for (let i = 0; i < GRID; i++) {
    put(i, 0, "outline");
    put(i, GRID - 1, "outline");
    put(0, i, "outline");
    put(GRID - 1, i, "outline");
  }

  if (state.excused) {
    // A flat bar. Excused is neither present nor absent.
    for (let x = 2; x <= 7; x++) put(x, 4, "excused");
    for (let x = 2; x <= 7; x++) put(x, 5, "excused");
    return out;
  }

  if (state.fill === null) return out;

  if (state.fill <= 0) {
    // Absent: a cross through the inside of the box.
    for (let i = 0; i < INNER; i++) {
      put(1 + i, 1 + i, "absent");
      put(1 + i, INNER - i, "absent");
    }
    return out;
  }

  // Present, in part or in full: the box fills from the bottom up, so a
  // half mark is literally half the box.
  const rows = Math.max(1, Math.round(state.fill * INNER));
  for (let r = 0; r < rows; r++) {
    const y = INNER - r;
    for (let x = 1; x <= INNER; x++) put(x, y, "fill");
  }
  return out;
}

const TONE_CLASS: Record<Pixel["tone"], string> = {
  outline: "fill-current",
  fill: "fill-accent",
  absent: "fill-foreground",
  excused: "fill-muted-foreground",
};

/** The box on its own, at whatever size the caller gives it. */
export function BoxGlyph({
  state,
  className = "",
}: {
  state: BoxState;
  className?: string;
}) {
  const pixels = pixelsFor(state);

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {pixels.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          className={TONE_CLASS[p.tone]}
        />
      ))}
    </svg>
  );
}

/** The states a box can be in, in the order the chooser offers them. */
export const BOX_CHOICES: { state: BoxState; label: string; hint: string }[] = [
  { state: { fill: 1, excused: false }, label: "Present", hint: "On class for the whole session" },
  { state: { fill: 0.5, excused: false }, label: "Half", hint: "On class for part of it" },
  { state: { fill: 0, excused: false }, label: "Absent", hint: "Not on class" },
  { state: { fill: null, excused: true }, label: "Excused", hint: "Illness or death, not counted against them" },
  { state: { fill: null, excused: false }, label: "Not recorded", hint: "Nobody has marked this box" },
];
