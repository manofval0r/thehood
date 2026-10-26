import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink, FileText, Play, Clock } from "lucide-react";
import { getTool, TOOLS, type Tool } from "@/lib/tools";
import { getCourse } from "@/lib/resources";
import { CATEGORY_LABEL } from "@/lib/tools";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.id }));
}

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return {
    title: `${tool.name} · Tools of the Trade · Cybersecurity 300L`,
    description: tool.summary,
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      {/* Header */}
      <header className="rise mb-16">
        <div className="flex flex-wrap items-start justify-between gap-4 sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
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
                {CATEGORY_LABEL[tool.category]}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {tool.name}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {tool.summary}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <Link
              href={tool.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 max-sm:min-h-11"
            >
              <Download size={15} />
              Download {tool.name}
            </Link>
            <Link
              href={tool.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "pressable inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-border-strong hover:text-foreground max-sm:min-h-11",
                tool.downloadUrl === tool.docsUrl ? "hidden" : ""
              )}
            >
              <ExternalLink size={15} />
              Docs & community
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Left column: what it is, why needed, courses. */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why needed. */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent mb-3">
              Why this course needs it
            </h2>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {tool.whyNeeded}
            </p>
          </section>

          {/* Courses. */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent mb-3">
              Course{tool.courses.length === 1 ? "" : "s"}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {tool.courses.map((courseCode) => {
                const course = getCourse(
                  courseCode.toLowerCase().replace(/\s+/g, "-")
                );
                return (
                  <li key={courseCode}>
                    <Link
                      href={`/courses/${course?.slug ?? courseCode.toLowerCase().replace(/\s+/g, "-")}`}
                      className="pressable flex items-center gap-3 rounded-md border border-border bg-surface-hover px-3 py-2.5 transition-colors hover:bg-accent/5 hover:border-accent/50"
                    >
                      <span className="font-mono text-[12px] font-medium text-foreground">
                        {courseCode}
                      </span>
                      <span className="ml-auto text-[12px] text-muted">
                        {course?.title ?? courseCode}
                      </span>
                      <ArrowRight size={12} className="text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Right column: download steps, videos, docs. */}
        <div className="space-y-6">
          {/* Download steps. */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} className="text-accent" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent">
                How to download & install
              </h2>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              {tool.downloadSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 text-[11.5px] text-muted">
              Download from <Link href={tool.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:no-underline">the official site</Link> only. Mirror sites can carry tampered software.
            </p>
          </section>

          {/* Learn with videos. */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <Play size={16} className="text-accent" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent">
                Learn with videos
              </h2>
            </div>
            <ul className="space-y-3">
              {tool.videos.map((video, i) => (
                <li key={i}>
                  <Link
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pressable flex items-center gap-3 rounded-md border border-border bg-surface-hover px-3 py-2.5 transition-colors hover:border-accent hover:text-accent"
                  >
                    <span className="flex items-center justify-center rounded-full bg-accent text-accent-foreground px-2 py-1.5 text-[11px] font-semibold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {video.title}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {video.channel}
                      </span>
                    </div>
                    <ExternalLink size={14} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Docs & community. */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-accent" />
              <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-accent">
                Documentation & community
              </h2>
            </div>
            <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              <li>
                <Link
                  href={tool.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-2 text-accent underline underline-offset-4 hover:no-underline"
                >
                  <ExternalLink size={14} />
                  Official documentation
                </Link>
              </li>
              <li>
                <Link
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-2 text-accent underline underline-offset-4 hover:no-underline"
                >
                  <Download size={14} />
                  Download page
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
