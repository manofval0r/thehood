import { cn } from "@/lib/utils";

/**
 * The NUTM mark.
 *
 * Deliberately not a filled badge: the glyph sits on nothing. Depth comes
 * from a hard extrusion behind the face plus a chamfer highlight down the
 * top-left edge, so it reads as a cut object rather than a flat sticker.
 * Weight is heavy and the geometry is angular on purpose.
 */
export function NutmMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: 22,
    md: 30,
    lg: 42,
  }[size];

  // Extrusion depth scales with the glyph so small and large stay consistent.
  const depth = Math.max(2, Math.round(dims * 0.09));

  return (
    <svg
      width={dims}
      height={dims}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <defs>
        {/* Face: light from the top-left, falling away to the bottom-right. */}
        <linearGradient id="nutm-face" x1="4" y1="3" x2="27" y2="29">
          <stop offset="0%" stopColor="#8f8f8f" />
          <stop offset="42%" stopColor="#4d4d4d" />
          <stop offset="100%" stopColor="#232323" />
        </linearGradient>
        {/* The extruded side, lit less. */}
        <linearGradient id="nutm-side" x1="10" y1="10" x2="26" y2="30">
          <stop offset="0%" stopColor="#1c1c1c" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
        {/* Chamfer running down the top-left edge. */}
        <linearGradient id="nutm-edge" x1="5" y1="4" x2="14" y2="17">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Extrusion: the silhouette pushed back and down. */}
      <g transform={`translate(${depth * 0.55} ${depth})`} fill="url(#nutm-side)">
        <path d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z" />
      </g>

      {/* 2. Face. Chamfered shoulders rather than a smooth curve. */}
      <path
        d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z"
        fill="url(#nutm-face)"
      />

      {/* 3. Chamfer highlight, clipped to the face. */}
      <path
        d="M16 2.4 L28.6 8.2 V17.6 C28.6 24.4 23.4 29.2 16 30.6 C8.6 29.2 3.4 24.4 3.4 17.6 V8.2 Z"
        stroke="url(#nutm-edge)"
        strokeWidth="1.6"
      />

      {/* 4. Keyhole, cut heavy. Circle and stem merged into one silhouette. */}
      <path
        d="M16 11.1 a4.35 4.35 0 1 0 0.01 0 Z M13.9 15.2 h4.2 l1.5 8.1 h-7.2 Z"
        fill="#04140a"
        fillOpacity="0.92"
      />
      <path
        d="M16 12.6 a2.85 2.85 0 1 1 -0.01 0 Z"
        fill="#22c55e"
      />
      <path d="M15.1 16.2 h1.9 l1.15 6.2 h-4.2 Z" fill="#22c55e" />
    </svg>
  );
}

/** Wordmark: mark + programme name. Used in nav and footer. */
export function Wordmark({
  className,
  markClassName,
  size = "md",
}: {
  className?: string;
  /** To resize the mark alone, e.g. to make it smaller on a phone. */
  markClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = { sm: "text-sm", md: "text-[15px]", lg: "text-xl" }[size];
  const sub = { sm: "text-[9px]", md: "text-[10px]", lg: "text-[11px]" }[size];

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <NutmMark size={size} className={markClassName} />
      {/*
        data-wordmark-text is a stable hook for callers that want to drop the
        words and keep the mark. It cannot be done with a bare descendant
        selector: this component's root element is itself a span, so
        `[&_span]` matches the whole wordmark and hides everything, the mark
        included.
      */}
      <span data-wordmark-text className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-tight text-foreground", text)}>
          Cybersecurity 300L
        </span>
        <span
          className={cn(
            "mt-1 font-medium uppercase tracking-[0.16em] text-muted-foreground",
            sub
          )}
        >
          NUTM Apapa
        </span>
      </span>
    </span>
  );
}