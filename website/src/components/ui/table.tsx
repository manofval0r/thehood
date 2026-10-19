import { cn } from "@/lib/utils";

/**
 * Data-table primitives. Real tables get real table treatment:
 * sticky header, tone-stepped rows, tabular numerals, row hover.
 */

export function TableFrame({
  children,
  className,
  scrollTo = "start",
}: {
  children: React.ReactNode;
  className?: string;
  scrollTo?: "start" | "center" | "end";
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-auto rounded-lg border border-border bg-surface",
        className
      )}
    >
      {children}
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