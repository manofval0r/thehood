import { Suspense } from "react";
import { notFound } from "next/navigation";
import { COURSES, getCourse } from "@/lib/resources";
import { getCourseFiles, getCourseFolders, fileSize } from "@/lib/files";
import { getCourseVideos, thumbBaseUrl } from "@/lib/videos";
import CourseClient from "./client";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

// The client island reads searchParams (?r=fileId), so this route is allowed
// to render at request time rather than as a fully static shell.
export const instant = false;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const course = getCourse(slug);
  return {
    title: course ? `${course.code} · ${course.title}` : "Course not found",
    description: course
      ? `${course.title} (${course.code}), ${course.units} units, taught by ${course.lecturer}.`
      : undefined,
  };
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  // The files come from the index, which is cached and tagged. An upload
  // tags the index, so the next request picks the new file up without the
  // site having to be rebuilt.
  const files = await getCourseFiles(course.code);

  // The folders staff made, including the ones with nothing in them yet.
  const folders = await getCourseFolders(course.code);

  // The videos that belong to this course.
  const videos = await getCourseVideos(course.code);

  // The card wants a size a human can read, not a number of bytes. The
  // address is encoded here rather than at each use, so the card, the panel
  // and the viewer all point at the same working address.
  const resources = files.map((f) => ({
    id: f.id,
    title: f.title,
    type: f.type,
    url: f.url,
    size: fileSize(f.size),
    folder: f.folder ?? null,
  }));

  // CourseClient reads ?r= to open a file directly, so it needs a boundary.
  return (
    <Suspense fallback={null}>
      <CourseClient
        course={course}
        resources={resources}
        folders={folders}
        videos={videos.map((v) => ({
          id: v.id,
          title: v.title,
          youtube_id: v.youtube_id,
          note: v.note,
          thumb_path: v.thumb_path,
        }))}
        thumbBase={thumbBaseUrl() ?? ""}
      />
    </Suspense>
  );
}