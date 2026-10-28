import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays } from "lucide-react";
import { COURSES, DRIVE_FOLDER } from "@/lib/resources";
import { getAllFiles } from "@/lib/files";
import { getBulletinFeed } from "@/lib/bulletin";
import { currentStudent } from "@/lib/student-session";
import SearchBar from "@/components/SearchBar";
import { CourseCard } from "@/components/CourseCard";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import BulletinBoard from "@/components/BulletinBoard";

const totalUnits = COURSES.reduce((sum, course) => sum + course.units, 0);

export const metadata = {
  title: "Courses · Cybersecurity 300L",
  description:
    "Cybersecurity 300 Level courses, current class information, online meeting links, deadlines and cohort updates.",
};

export default async function Home() {
  const allFiles = await getAllFiles();

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 md:pb-12 md:pt-16 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-4xl font-bold tracking-[-0.025em] text-foreground md:text-5xl">
              Courses
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              First semester 2026/2027 · {COURSES.length} courses · {totalUnits} units
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Find a course or file, open the weekly timetable, or take the whole
            programme from the shared Drive.
          </p>

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start">
            <div className="relative z-20 min-w-0">
              <SearchBar />
            </div>
            <Link
              href="/timetable"
              className="pressable inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-accent px-4 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <CalendarDays size={17} />
              Weekly timetable
              <ArrowRight size={14} />
            </Link>
            <a
              href={DRIVE_FOLDER}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface px-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <PixelMotif
                  kind="folder"
                  title="A folder with every course in it"
                  className="h-5 w-5"
                />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[12.5px] font-semibold leading-snug text-foreground">
                  Shared Drive
                </span>
                <span className="block text-[11px] text-muted">Every course folder</span>
              </span>
              <ArrowUpRight size={14} className="ml-auto text-muted" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 md:pt-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              All courses
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Open a course for its files, folders, videos, lecturer and class details.
            </p>
          </div>
          <Link
            href="/registration"
            className="pressable inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            Registration list
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COURSES.map((course, index) => (
            <Reveal key={course.slug} delay={index * 45} className="h-full">
              <CourseCard
                course={course}
                index={index}
                fileCount={allFiles.filter((file) => file.course === course.code).length}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div
              aria-label="Loading campus bulletin"
              className="h-[34rem] animate-pulse rounded-2xl border border-border bg-surface"
            />
          }
        >
          <BulletinArea />
        </Suspense>
      </section>
    </div>
  );
}

async function BulletinArea() {
  await connection();
  const student = await currentStudent();
  const feed = await getBulletinFeed({ student });
  return <BulletinBoard initialFeed={feed} initialVerified={Boolean(student)} />;
}
