import { cn } from "@/lib/utils";

/**
 * Pixel art: a hooded figure working at a laptop, lit by the screen.
 * Inline SVG so it stays crisp at any size and never waits on a raster decode.
 * The grid is authored in the generator (pixelart/gen.js) and mirrored here.
 */

const COLORS: Record<string, string> = {
  H: "#8a8a8a", // hood outer (top-lit)
  D: "#5f5f5f", // hood deep
  d: "#3d3d3d", // hood core shadow
  R: "#22c55e", // rim light from the screen
  F: "#141414", // face. Kept dark; the shadow is the point.
  E: "#86efac", // eyes
  S: "#16a34a", // screen surface
  G: "#4ade80", // screen glow band
  W: "#dcfce7", // screen hotspot
  B: "#4a4a4a", // body / shoulders
  L: "#a3a3a3", // laptop lid
  K: "#525252", // key deck
  X: "#8f8f8f", // hands
};

const GRID = [
  ".....................HHHHHHHHHHHHHHH....................",
  "...................HHHHHHHHHHHHHHHHHHH..................",
  "..................HHHHDDDDDDDDDDDDHHHH..................",
  "................HHHHDDDDDDDDDDDDDDHHHH..................",
  "...............HHHHDDDDddddddddddDDDDHHH.................",
  "..............HHHHDDdRRRRRRRRRRRRRDdHHHH................",
  "..............HHHHDdRRRRRRRRRRRRRRdHHHH................",
  ".............HHHHDdRRFFFFFFFFFFFFFRRdHHHH................",
  ".............HHHHDdRRFFFRFFFFFFFRFFRdHHHH................",
  ".............HHHHDdRRFFFRFFFFFFFRFFRdHHHH................",
  ".............HHHHDdRRFFFFFFFFFFFFFFRRdHHHH................",
  "..............HHHHDdRRFFFFFFFFFFFFRdHHHH.................",
  "...............HHHHDdRRFFFFFFFFRRdHHHH..................",
  "................HHHHDdRRRRRRRRRRdHHHH....................",
  ".................HHHHdDDDDDDDDDdHHHH....................",
  "..................HHHHHDDDDDDHHHHH......................",
  "...................HHHHHddddHHHHH.......................",
  "..................BBBBBBHHHBBBBBB........................",
  "................BBBBBBHHHHHBBBBBB.......................",
  "..............BBBBBBBBHHHHHBBBBBBBB......................",
  ".............BBBBBBBBBHHHHHBBBBBBBBB.....................",
  "............BBBBBBBBBBBBBBBBBBBBBBBBB....................",
  "...........BBBBBBBBBBBBBBBBBBBBBBBBBBB...................",
  "..........BBBBBBBBBBBBBBBBBBBBBBBBBBBBB..................",
  "...........BBBBBBBBBBLLLLLLLLLLBBBBBBBBB.................",
  "..........BBBBBBBBBLLSSSSSSSSSSLLBBBBBBBB................",
  "..........BBBBBBBBLLSSSSSSSSSSLLBBBBBBBB................",
  ".........BBBBBBBBBLLSSSSSSSSSSLLBBBBBBBBB...............",
  ".........BBBBBBBBBLLSSSSSSSSSSLLBBBBBBBBB...............",
  ".........BBBBBBBBBLLSGSSSSSSSGSLLBBBBBBBBB...............",
  ".........BBBBBBBBBLLSSSSSSSSSSLLBBBBBBBBB...............",
  ".........BBBBBBBBBLLSSSSSSSSSSLLBBBBBBBBB...............",
  "..........BBBBBBBBLLLSGSSSSSGSLLLBBBBBBBB................",
  "..........BBBBBBBBBLLWWSSSSSSWWLLBBBBBBBB................",
  "...........BBBBBBBBBWWWWWWWWWWWWBBBBBBBBB................",
  "............BBBBBBBBWWKKKKKKKKWWBBBBBBBBB...............",
  "............BBBBBBBBBWWKKKKKKWWBBBBBBBBB................",
  ".............BBBBBBBBWWWWWWWWWWBBBBBBBBB.................",
  "..............BBBBBBBBBXXXXXXBBBBBBBBB...................",
  "................BBBBBBXXXXXXBBBBBB......................",
  "...................BBBBBBBBBBBBBB........................",
  ".....................BBBBBBBBBB..........................",
];

const COLS = Math.max(...GRID.map((r) => r.length));
const ROWS = GRID.length;

export function PixelArt({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  const cells: React.ReactNode[] = [];

  GRID.forEach((row, y) => {
    const pad = Math.floor((COLS - row.length) / 2);
    row.split("").forEach((ch, cx) => {
      const fill = COLORS[ch];
      if (!fill) return;
      cells.push(
        <rect key={`${y}-${cx}`} x={pad + cx} y={y} width={1} height={1} fill={fill} />
      );
    });
  });

  return (
    <svg
      viewBox={`0 0 ${COLS} ${ROWS}`}
      className={cn("h-auto w-full", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
    >
      {cells}
    </svg>
  );
}

export default PixelArt;