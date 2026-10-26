import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS, toolsByCategory, CATEGORY_LABEL } from "@/lib/tools";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tools of the Trade · Cybersecurity 300L",
  description:
    "Software the labs use: where to download it, why each course needs it, and how to learn it.",
};

/**
 * Tools of the trade.
 *
 * One card per tool: what it is, which course needs it, why it matters, and
 * where to get it. Click a tool to open its own page with download steps,
 * documentation, community links and videos showing how to use it.
 */

export default function ToolsPage() {
  const byCategory = toolsByCategory();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl mb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Tools of the trade
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Software the labs assume you will use: where to download it, which
          course needs it, and why. Every link goes to the maker's own site -
          nothing third-party loads on this origin.
        </p>
      </header>

      <div className="space-y-24 pb-24">
        {Object.entries(byCategory).map(([category, tools]) => (
          <section key={category} className="scroll-mt-24">
            <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]}
              </h2>
              <span className="tnum text-[13px] text-muted">
                {tools.length} tool{tools.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.id} className="h-full">
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="border-t border-border pb-20 pt-8 text-[13px] leading-relaxed text-muted-foreground">
        These are external sites and are not operated by the department.
        Download from the official source only - mirror sites can carry
        tampered software. The tools below are the ones the labs assume you
        will use; your lecturer will tell you which ones each assignment
        needs.
      </p>
    </div>
  );
}

interface ToolCardProps {
  tool: typeof TOOLS[number];
}

function ToolCard({ tool }: ToolCardProps) {
  const courseLabels = tool.courses.map((c) => c.replace(/\s+/g, " "));

  return (
    <AppleCard maxTilt={5} className="h-full">
      <div
        className="card-tilt settle relative flex h-full flex-col rounded-lg border border-border bg-surface p-5"
      >
        <span className="card-cast" aria-hidden="true" />
        <span className="card-bevel" aria-hidden="true" />

        <div className="card-depth flex flex-col h-full" style={{ "--depth": "14px" } as React.CSSProperties}>
          {/* Mark + category + external link marker. */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span
              className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(45,212,191,0.10)" }}
            >
              <span className="h-8 w-7">
                <PixelMotif kind="tool" title="A spanner head and handle" className="h-full w-full" />
              </span>
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded px-1 font-mono text-[8px] font-bold tracking-tight"
                style={{ background: "#2dd4bf", color: "#0a0a0a" }}
              >
                Tool
              </span>
            </span>
            <span className="tnum text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {tool.category}
            </span>
          </div>

          {/* Name. */}
          <h3
            className="card-depth mt-0 mb-1 text-[15px] font-semibold leading-snug text-foreground"
            style={{ "--depth": "24px" } as React.CSSProperties}
          >
            {tool.name}
          </h3>

          {/* One-line summary. */}
          <span
            className="card-depth mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground"
            style={{ "--depth": "18px" } as React.CSSProperties}
          >
            {tool.summary}
          </span>

          {/* Course tags. */}
          <div className="card-depth mt-3 flex flex-wrap gap-1.5" style={{ "--depth": "10px" } as React.CSSProperties}>
            {courseLabels.map((course) => (
              <span
                key={course}
                className="rounded-md border border-border bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {course}
              </span>
            ))}
          </div>

          {/* Footer: why needed + go to tool page. */}
          <div className="card-depth mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border/50" style={{ "--depth": "20px" } as React.CSSProperties}>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {tool.whyNeeded.slice(0, 90)}{tool.whyNeeded.length > 90 ? "…" : ""}
            </span>
            <Link
              href={`/tools/${tool.id}`}
              className="pressable inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[11.5px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Open tool →
            </Link>
          </div>
        </div>
      </div>
    </AppleCard>
  );
}
