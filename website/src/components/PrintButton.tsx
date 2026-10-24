"use client";

import { Printer } from "lucide-react";

/**
 * Opens the browser print dialog for the current page.
 *
 * Timetable and registration are the two sheets people pin to a wall, so the
 * print stylesheet needs a control to reach. window.print is used rather than
 * a rendered PDF because it goes through the same @media print rules the
 * student will get from their own browser's print menu.
 */
export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide pressable inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover max-sm:min-h-11"
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
