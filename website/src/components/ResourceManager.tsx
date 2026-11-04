"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, Play } from "lucide-react";
import CoursePicker, { type CourseOption } from "@/components/CoursePicker";
import FileManager, { type FileRow } from "@/components/FileManager";
import VideoManager, { type VideoRow } from "@/components/VideoManager";
import { cn } from "@/lib/utils";

/**
 * Files and videos are the same job: putting material on a course page.
 *
 * They were two pages with two course pickers, both labelled with codes. That
 * made it possible to add a file to one course and a video to another without
 * ever seeing the mistake. Here the course is chosen once, the name is in
 * front of the reader the whole time, and the two kinds of material sit behind
 * one pair of tabs.
 */
export default function ResourceManager({
  courses,
  files,
  folders,
  videos,
  thumbBase,
  initialTab,
  initialCourse,
}: {
  courses: CourseOption[];
  files: FileRow[];
  folders: Record<string, string[]>;
  videos: VideoRow[];
  /** The address the video pictures are served from, on this site. */
  thumbBase: string;
  /** The tab named in the URL, so a shared link opens the right one. */
  initialTab: "files" | "videos";
  /** The course named in the URL, e.g. ?course=NUT-MAN+315. */
  initialCourse?: string;
}) {
  const [course, setCourse] = useState(
    () => (initialCourse && courses.some((c) => c.code === initialCourse)
      ? initialCourse
      : courses[0]?.code ?? "")
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: "files" | "videos" =
    requestedTab === "files" || requestedTab === "videos"
      ? requestedTab
      : initialTab;

  // The URL is the source of truth, so a reload, a shared link and the
  // browser's back and forward buttons all open the same tab.
  function selectTab(next: "files" | "videos") {
    if (next === tab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const fileCount = files.filter((f) => f.course === course).length;
  const videoCount = videos.filter((v) => v.course === course).length;
  const current = courses.find((c) => c.code === course);
  const title = current?.title ?? course;

  const tabClass = (active: boolean) =>
    cn(
      "pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors max-sm:min-h-11 max-sm:px-4 max-sm:text-[13px]",
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <CoursePicker courses={courses} value={course} onChange={setCourse} />
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              id="resource-tab-files"
              role="tab"
              aria-selected={tab === "files"}
              aria-controls="resource-panel"
              onClick={() => selectTab("files")}
              className={tabClass(tab === "files")}
            >
              <FolderOpen size={13} aria-hidden="true" />
              Files
              <span
                className={cn(
                  "tnum rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  tab === "files"
                    ? "bg-accent-foreground/15 text-accent-foreground"
                    : "bg-surface-hover text-muted"
                )}
              >
                {fileCount}
              </span>
            </button>
            <button
              type="button"
              id="resource-tab-videos"
              role="tab"
              aria-selected={tab === "videos"}
              aria-controls="resource-panel"
              onClick={() => selectTab("videos")}
              className={tabClass(tab === "videos")}
            >
              <Play size={13} aria-hidden="true" />
              Videos
              <span
                className={cn(
                  "tnum rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  tab === "videos"
                    ? "bg-accent-foreground/15 text-accent-foreground"
                    : "bg-surface-hover text-muted"
                )}
              >
                {videoCount}
              </span>
            </button>
          </div>
          <p className="text-[11.5px] text-muted">
            Both appear on the course page.
          </p>
        </div>
      </div>

      <div
        id="resource-panel"
        role="tabpanel"
        aria-labelledby={
          tab === "files" ? "resource-tab-files" : "resource-tab-videos"
        }
        className="mt-4 rounded-xl border border-border bg-surface p-4 sm:p-6"
      >
        {tab === "files" ? (
          <FileManager
            key={course}
            course={course}
            courseTitle={title}
            files={files}
            folders={folders}
          />
        ) : (
          <VideoManager
            key={course}
            course={course}
            courseTitle={title}
            videos={videos}
            thumbBase={thumbBase}
          />
        )}
      </div>
    </div>
  );
}
