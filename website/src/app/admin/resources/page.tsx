import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import ResourceManager from "@/components/ResourceManager";
import { currentStaff } from "@/lib/admin-session";
import { getAllFiles, getFoldersByCourse } from "@/lib/files";
import { COURSES } from "@/lib/resources";
import { can } from "@/lib/staff";
import { getAllVideos, thumbBaseUrl } from "@/lib/videos";

export const metadata = {
  title: "Resources · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * The course resources.
 *
 * Files and videos were two pages doing the same job, each with its own
 * course picker labelled with codes. The picker is now shared, the course is
 * named in full, and the two kinds of material are tabs on one page.
 */
export default function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Resources"
        lede="Files and videos for every course, in one place. Choose the course first, then the kind of material. A file added here appears on the course page, in the search and in the counts, and a video's picture is kept on this site."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <ResourcesArea searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function ResourcesArea({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const initialTab = (await searchParams).tab === "videos" ? "videos" : "files";
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!can(me, "files")) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Adding resources is not one of your permissions
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but you have not been allowed to add or remove
          course material. A video is a course file, so it is the same
          permission. A super admin can turn it on from the staff page.
        </p>
      </div>
    );
  }

  const [files, folders, videos] = await Promise.all([
    getAllFiles(),
    getFoldersByCourse(),
    getAllVideos(),
  ]);

  return (
    <ResourceManager
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
      files={files.map((f) => ({
        id: f.id,
        course: f.course,
        title: f.title,
        type: f.type,
        url: f.url,
        size: f.size,
        source: f.source,
        folder: f.folder ?? null,
      }))}
      folders={folders}
      videos={videos.map((v) => ({
        id: v.id,
        course: v.course,
        title: v.title,
        youtube_id: v.youtube_id,
        note: v.note,
        position: v.position,
        thumb_path: v.thumb_path,
        added_by: v.added_by,
      }))}
      thumbBase={thumbBaseUrl() ?? ""}
      initialTab={initialTab}
    />
  );
}
