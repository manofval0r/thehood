import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import VideoManager from "@/components/VideoManager";
import { currentStaff } from "@/lib/admin-session";
import { can } from "@/lib/staff";
import { getAllVideos, thumbBaseUrl, videoCourses } from "@/lib/videos";

export const metadata = {
  title: "Course videos · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * The course videos.
 *
 * A lecture recording, or a recording of somebody else's lecture that is
 * worth a student's afternoon. It sits with the course on the course page,
 * under Watch.
 */
export default async function AdminVideosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Course videos"
        lede="A lecture recording, or a recording worth a student's afternoon. The picture is fetched by the server and kept on this site, so a reader's browser never asks YouTube for it."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <VideosArea />
      </Suspense>
    </div>
  );
}

function AreaSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden="true">
      <div className="h-4 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

async function VideosArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!can(me, "files")) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Adding videos is not one of your permissions
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but you have not been allowed to add or remove
          course files. A video is a course file, so it is the same permission.
          A super admin can turn it on from the staff page.
        </p>
      </div>
    );
  }

  const videos = await getAllVideos();

  return (
    <VideoManager
      courses={videoCourses()}
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
    />
  );
}
