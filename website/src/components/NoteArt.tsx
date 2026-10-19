import { cn } from "@/lib/utils";

/**
 * Pixel illustrations for the timetable notes.
 *
 * Same grid language and palette as PixelArt so the whole site shares one
 * visual vocabulary. Each motif carries meaning rather than decorating:
 * a freed Friday, a building plan, and an unfilled nameplate.
 */

const C = {
  l: "#6b6b6b", // structure line
  L: "#8a8a8a", // lit structure
  d: "#3d3d3d", // deep shade
  b: "#1f1f1f", // fill / body
  G: "#22c55e", // accent
  g: "#4ade80", // accent highlight
  W: "#dcfce7", // brightest
};

const CALENDAR = [
  "........................",
  "..LLLLLLLLLLLLLLLLLLLL..",
  "..L..................L..",
  "..L..................L..",
  "..L..bb..bb..bb..bb..L..",
  "..L..................L..",
  "..L..bb..bb..bb..bb..L..",
  "..L..................L..",
  "..L..bb..bb..bb..GGGG..",
  "..L..bb..bb..bb..ggGG..",
  "..L...................G.",
  "..LLLLLLLLLLLLLLLLLLLL..",
  "........................",
  "........................",
];

// A plain pin with the centre left open. The earlier version ringed a filled
// hole, which turned to mush at 112px. Fewer, larger marks read better.
const PLAN = [
  "......GGGG............",
  "....GG....GG..........",
  "...G......G...........",
  "..G........G..........",
  "..G........G..........",
  "..G........G..........",
  "..G........G..........",
  "...G......G...........",
  "....GG....GG..........",
  "......GGGG............",
  ".......GG.............",
  "........G.............",
  "........G.............",
  "......................",
];

const NAMEPLATE = [
  "........................",
  "..aaaaaaaaaaaaaa.......",
  "..a............a.......",
  "..a...GGGG...a.........",
  "..a..GG....GG.a.........",
  "..a..G......G.a.........",
  "..a..G......G.a.........",
  "..a...GG..GG.a.........",
  "..a....GGGG..a.........",
  "..a.....GG...a.........",
  "..a..........a.........",
  "..a.....GG...a.........",
  "..a....GGGG..a.........",
  "..aaaaaaaaaaaaaa.......",
  "........................",
];

const GRIDS = { calendar: CALENDAR, plan: PLAN, plate: NAMEPLATE };

function Motif({
  rows,
  className,
}: {
  rows: string[];
  className?: string;
}) {
  const cols = Math.max(...rows.map((r) => r.length));
  const cells: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    const pad = Math.floor((cols - row.length) / 2);
    row.split("").forEach((ch, cx) => {
      const fill = C[ch as keyof typeof C];
      if (!fill) return;
      cells.push(
        <rect key={`${y}-${cx}`} x={pad + cx} y={y} width={1} height={1} fill={fill} />
      );
    });
  });

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows.length}`}
      className={cn("h-auto w-full", className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

export function NoteArt({
  variant,
  className,
}: {
  variant: keyof typeof GRIDS;
  className?: string;
}) {
  return <Motif rows={GRIDS[variant]} className={className} />;
}

export default NoteArt;