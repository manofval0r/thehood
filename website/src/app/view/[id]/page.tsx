import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getFileById, fileSize } from "@/lib/files";
import { getCourse, resourceUrl, COURSES } from "@/lib/resources";
import { kindOf, KIND_LABEL } from "@/lib/file-kinds";
import Viewer from "@/components/viewers/Viewer";

/**
 * The viewer.
 *
 * One address for every kind of file: a lecture note, a slide deck, a
 * spreadsheet, a message, a table of evidence. The address holds the file's
 * id and nothing else, so a link keeps working when the file is renamed,
 * and so the only thing in it that could be guessed is an id.
 */

/**
 * The addresses that are known when the site is built.
 *
 * The files in the repository are known from the manifest, so their viewer
 * pages are built with the site. A file staff upload afterwards is not in
 * this list, and its page is made when it is first opened, which is what
 * makes an upload openable straight away.
 */
export function generateStaticParams() {
  return COURSES.flatMap((course) =>
    course.resources.map((resource) => ({ id: resource.id }))
  );
}

/**
 * The page reads the file index, which is not part of the build, so it is
 * rendered when it is asked for rather than baked into the build.
 */
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const file = await getFileById(id);
  if (!file) return { title: "File not found" };
  return {
    title: `${file.title} · ${file.course}`,
    description: `${KIND_LABEL[kindOf(file)]} from ${file.course}.`,
  };
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const file = await getFileById(id);
  if (!file) notFound();

  const course = getCourse(
    // The course is found by code, and the slug is the code with the spaces
    // and dots taken out.
    file.course.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
  const href = resourceUrl(file.url);
  const displaySize = fileSize(file.size);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {course && (
            <Link
              href={`/courses/${course.slug}`}
              className="pressable mb-3 inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {course.code}
            </Link>
          )}
          <h1 className="text-[clamp(1.375rem,3vw,1.75rem)] font-bold leading-tight tracking-[-0.015em] text-foreground">
            {file.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
              {KIND_LABEL[kindOf(file)]}
            </span>
            {displaySize && (
              <span className="tnum text-[11.5px] text-muted">{displaySize}</span>
            )}
          </div>
        </div>

        <a
          href={href}
          download
          className="pressable inline-flex shrink-0 items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Download size={15} />
          Download
        </a>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <Suspense fallback={null}>
          <Viewer
            file={{
              id: file.id,
              title: file.title,
              url: href,
              type: file.type,
              size: displaySize,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
