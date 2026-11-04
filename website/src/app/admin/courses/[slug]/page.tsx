import { Suspense } from "react";
import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import { currentStaff } from "@/lib/admin-session";
import { getCourse } from "@/lib/resources";

export const metadata = {
  title: "Course · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

export const instant = false;

/**
 * The admin mirror of a course page.
 *
 * "nutmcybersecurity.vercel.app/admin/courses/nut-man-315" is not a page of
 * its own: it is the same course the student sees, opened in the editor. A
 * route that mirrors public pages keeps the mental model simple — paste the
 * address, change nothing but /admin at the front, and you are editing what
 * you were looking at.
 *
 * It only knows how to open the resources side of a course (that is the
 * action a lecturer comes here to perform), so it redirects there with the
 * course already selected.
 */
export default function AdminCourseMirrorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        eyebrow="Staff"
        title="Opening course resources"
        lede="This address mirrors the public course page in the staff area. It asks for your sign-in, then opens the resources page with the course dropdown already pointed at this course."
      />
      <Suspense fallback={<div className="mt-10 h-24 animate-pulse rounded-lg border border-border" />}>
        <Mirror params={params} />
      </Suspense>
    </div>
  );
}

async function Mirror({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const me = await currentStaff();
  if (!me) return <AdminLogin />;

  redirect(`/admin/resources?course=${encodeURIComponent(course.code)}`);
}
