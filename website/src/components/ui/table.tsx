"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Data-table primitives. Real tables get real table treatment:
 * sticky header, tone-stepped rows, tabular numerals, row hover.
 */

/**
 * A scrollable table box that says so.
 *
 * `overflow-x-auto` alone is invisible. A table wider than the screen looks
 * exactly like a table that has been cut off, and on a phone the reader has no
 * reason to try dragging it. The edge fades are the cue: one on the right while
 * there is more to reach, one on the left once there is, both gone at the ends
 * so the reader is never told to scroll past the end of the content.
 *
 * A fade rather than a 1px rule, deliberately. A rule reads as a border on the
 * data, and what is actually happening is content continuing under a surface.
 */
export function TableFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      const next = {
        right: overflow > 1 && el.scrollLeft < overflow - 1,
        left: el.scrollLeft > 1,
      };
      // Same bail-out as the navbar's scroll flag: this runs on every scroll
      // frame, and React skips the render when nothing actually changed.
      setEdges((prev) =>
        prev.left === next.left && prev.right === next.right ? prev : next
      );
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // Resize, because a window resize or a late font load changes clientWidth
    // without any scroll event ever firing.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        className="overflow-x-auto overflow-y-auto rounded-lg border border-border bg-surface"
      >
        {children}
      </div>

      {/* pointer-events-none so a fade never eats a drag meant for the table
          underneath it. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent transition-opacity duration-200",
          edges.left ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent transition-opacity duration-200",
          edges.right ? "opacity-100" : "opacity-0"
        )}
      />

      {/* The instruction, shown only while it is true. Saying "scroll for
          more" on a table that fits would be a lie, and it would become one
          again the moment the window grew. */}
      {edges.right && (
        <p className="mt-2 text-[12px] text-muted-foreground sm:hidden">
          Swipe the table sideways for the remaining columns.
        </p>
      )}
    </div>
  );
}

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table
      className={cn("w-full border-collapse text-left", className)}
    >
      {children}
    </table>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky-head">
      <tr className="border-b border-border-strong">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  className,
  width,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
  emphasis,
}: {
  children: React.ReactNode;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors last:border-b-0",
        emphasis ? "bg-surface-raised" : "hover:bg-surface-hover",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  className,
  numeric,
  strong,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  numeric?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[13px] leading-snug",
        numeric && "tnum",
        strong ? "font-medium text-foreground" : "text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

/** Row-group label that spans the table, e.g. a timetable day. */
export function DayGroup({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <tr className="border-b border-border-strong bg-surface-raised">
      <td colSpan={100} className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
            {children}
          </span>
          {count !== undefined && (
            <span className="tnum rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}