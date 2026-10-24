import Link from "next/link";
import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { COURSES, DRIVE_FOLDER } from "@/lib/resources";
import { getAllFiles } from "@/lib/files";
import SearchBar from "@/components/SearchBar";
import { CourseCard } from "@/components/CourseCard";
import PixelArt from "@/components/PixelArt";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import NextClassCountdown from "@/components/NextClassCountdown";

const totalUnits = COURSES.reduce((sum, c) => sum + c.units, 0);

export const metadata = {
  title: "Courses · Cybersecurity 300L",
  description:
    "All ten registered courses for the Cybersecurity 300 Level programme, with lecture notes, lab manuals and assignments.",
};

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={
          accent
            ? "tnum text-3xl font-bold leading-none text-accent"
            : "tnum text-3xl font-bold leading-none text-foreground"
        }
      >
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function Home() {
  // The counts come from the file index, so a file staff uploaded is
  // counted the moment it is added.
  const allFiles = await getAllFiles();
  const coursesWithFiles = new Set(allFiles.map((f) => f.course));
  const totalResources = allFiles.length;
  const withFiles = coursesWithFiles.size;
  return (
    <div>
      {/* ================= HERO ================= */}
      {/*
        No overflow-hidden here. The search results panel is absolutely
        positioned and extends well past the section box; clipping the hero
        truncated the dropdown mid-list. Horizontal bleed is handled by
        overflow-x-clip on <body>, which unlike overflow-hidden does not
        create a scroll container and so leaves the sticky nav working.
      */}
      <section className="relative border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pb-20 pt-14 md:pt-20">
            {/* Department line */}
            <div className="rise flex items-center gap-3" style={{ animationDelay: "0ms" }}>
              <span className="h-px w-8 bg-accent/60" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Department of Cybersecurity
              </span>
              <span className="text-[11px] text-muted-foreground">
                First semester 2026/2027
              </span>
            </div>

            {/* Headline spans the full measure, not a column */}
            <h1
              className="settle mt-10 max-w-[16ch] text-[clamp(2.75rem,8.5vw,6rem)] font-bold leading-[0.92] tracking-[-0.045em] text-foreground"
              style={{ animationDelay: "80ms" }}
            >
              Every lecture note, lab and handout.
            </h1>

            {/* Below the fold of the hero: copy left, artwork right */}
            <div className="mt-14 grid items-end gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
              <div>
                <p
                  className="rise max-w-[48ch] text-lg leading-relaxed text-muted-foreground"
                  style={{ animationDelay: "160ms" }}
                >
                  All ten courses in the Cybersecurity 300 Level programme,
                  alongside the week-by-week calendar for 2026/2027. Open a file
                  straight from search, or take a whole course as a zip.
                </p>

                {/* The rise animation leaves a transform on this node, which
                    creates a stacking context. Without an explicit z-index the
                    results panel would be painted under the stats row below. */}
                <div
                  className="rise relative z-20 mt-9 max-w-xl"
                  style={{ animationDelay: "240ms" }}
                >
                  <SearchBar />
                </div>

                {/* The whole programme on one drive. The department keeps the
                    course material there, so the folder is offered next to
                    the search rather than instead of it: the search reads
                    the files in the browser, the folder is where they are
                    kept. */}
                <a
                  href={DRIVE_FOLDER}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable rise mt-4 inline-flex max-w-xl items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
                  style={{ animationDelay: "280ms" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10">
                    <PixelMotif
                      kind="folder"
                      title="A folder with every course in it"
                      className="h-5 w-5"
                    />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-[13.5px] font-medium leading-snug text-foreground">
                      All the courses on Google Drive
                    </span>
                    <span className="block text-[12.5px] leading-snug text-muted-foreground">
                      The whole programme in one shared folder
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="ml-auto shrink-0 text-muted-foreground"
                  />
                </a>

                <div
                  className="rise mt-12 flex flex-wrap items-center gap-x-12 gap-y-6 border-t border-border pt-8"
                  style={{ animationDelay: "320ms" }}
                >
                  <Stat value={COURSES.length} label="Courses" />
                  <Stat value={totalUnits} label="Units" />
                  <Stat value={totalResources} label="Files uploaded" accent />
                  <Stat value={withFiles} label="Courses with files" />
                </div>
              </div>

              <div
                className="rise hidden lg:block"
                style={{ animationDelay: "380ms" }}
              >
                <div className="relative flex justify-center">
                  {/*
                    Sized with inset, not scale. A transform here widens the
                    layout box past the viewport and the whole page scrolls
                    sideways; a blur filter paints beyond its box without
                    affecting scroll width.
                  */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-6 -z-10 rounded-full bg-accent/20 blur-3xl"
                  />
                  <PixelArt
                    title="Pixel art of a hooded figure working at a laptop, lit by the screen"
                    className="w-full max-w-[420px] drop-shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SESSION SNAPSHOT ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-surface px-6 py-12 md:px-10 md:py-16">
          <NextClassCountdown />
        </div>
      </section>

      {/* ================= COURSES ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              All courses
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Ten registered courses, {totalUnits} units in total.
            </p>
          </div>
          <Link
            href="/registration"
            className="pressable inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground max-sm:min-h-11"
          >
            Registration list
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-12 grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COURSES.map((course, i) => (
            <Reveal key={course.slug} delay={i * 45} className="h-full">
              <CourseCard
                course={course}
                index={i}
                fileCount={
                  allFiles.filter((f) => f.course === course.code).length
                }
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CLOSING ================= */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-foreground">
                {COURSES.length - withFiles} courses are still empty.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Files appear here the moment a lecturer uploads them. Admin
                upload is being built so that adding a lecture note takes one
                drag and drop instead of a repository commit.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/timetable"
                className="card-lift group rounded-lg border border-border bg-background p-5"
              >
                <h3 className="text-[14px] font-semibold text-foreground">
                  Weekly timetable
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Venues, lecturers and times for every course.
                </p>
              </Link>
              <a
                href="/docs/300L_Cyber-Security_Timetable (1).pdf"
                download
                className="card-lift group rounded-lg border border-border bg-background p-5"
              >
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                  <Download size={14} className="text-accent" />
                  Official PDF
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  The timetable as issued by the department.
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}