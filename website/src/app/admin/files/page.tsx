import { Suspense } from "react";
import { connection } from "next/server";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminLogin } from "@/components/AdminLogin";
import { FileManager } from "@/components/FileManager";
import { currentStaff } from "@/lib/admin-session";
import { getAllFiles } from "@/lib/files";
import { can } from "@/lib/staff";
import { COURSES } from "@/lib/resources";

export const metadata = {
  title: "Course files · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

/**
 * The course files.
 *
 * A file added here appears on the course page, in the search and in the
 * counts, without the site being rebuilt.
 */
export default async function AdminFilesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <AdminHeader
        title="Course files"
        lede="A file added here appears on the course page, in the search and in the counts, without the site being rebuilt. Twenty-five megabytes is the limit."
      />

      <Suspense fallback={<AreaSkeleton />}>
        <FilesArea />
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

async function FilesArea() {
  await connection();
  const me = await currentStaff();

  if (!me) {
    return <AdminLogin />;
  }

  if (!can(me, "files")) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          Uploading files is not one of your permissions
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          You can sign in, but you have not been allowed to add or remove
          files. A super admin can turn it on from the staff page.
        </p>
      </div>
    );
  }

  const files = await getAllFiles();

  return (
    <FileManager
      courses={COURSES.map((c) => ({ code: c.code, title: c.title }))}
      files={files.map((f) => ({
        id: f.id,
        course: f.course,
        title: f.title,
        type: f.type,
        size: f.size,
        source: f.source,
      }))}
    />
  );
}
