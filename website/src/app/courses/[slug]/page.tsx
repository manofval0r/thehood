import { Suspense } from "react";
import { notFound } from "next/navigation";
import { COURSES, getCourse } from "@/lib/resources";
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

  // CourseClient reads ?r= to open a file directly, so it needs a boundary.
  return (
    <Suspense fallback={null}>
      <CourseClient course={course} />
    </Suspense>
  );
}