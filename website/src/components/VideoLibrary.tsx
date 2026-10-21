"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import PixelMotif from "@/components/PixelMotif";

/**
 * The videos of a course.
 *
 * The picture is served from this site, not from YouTube, because a page
 * that asks somebody else's server for an image tells that server who was
 * reading. The video itself is YouTube's and is only loaded when somebody
 * presses play, from the embed that does not set tracking cookies until
 * then.
 */

export interface VideoRow {
  id: string;
  title: string;
  youtube_id: string;
  note: string | null;
  thumb_path: string | null;
}

export default function VideoLibrary({
  videos,
  thumbBase,
}: {
  videos: VideoRow[];
  thumbBase: string;
}) {
  const [playing, setPlaying] = useState<VideoRow | null>(null);

  if (videos.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="border-t border-border pt-10">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Watch
          <span className="tnum ml-2.5 text-lg font-normal text-muted-foreground">
            {videos.length}
          </span>
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          The lectures, recorded. Press play and the video loads from
          YouTube; nothing is loaded from anywhere else before you do.
        </p>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id}>
            <button
              type="button"
              onClick={() => setPlaying(video)}
              className="pressable group block w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors hover:border-border-strong"
            >
              <span className="relative block aspect-video w-full overflow-hidden bg-black">
                {video.thumb_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${thumbBase}/${video.thumb_path}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center">
                    <PixelMotif
                      kind="video"
                      title="A video player with a play triangle and a progress bar"
                      className="h-10 w-10"
                    />
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-black/70 text-white ring-1 ring-inset ring-white/25 transition-transform group-hover:scale-105">
                    <Play size={20} className="ml-0.5" />
                  </span>
                </span>
              </span>

              <span className="block p-4">
                <span className="block text-[14px] font-medium leading-snug text-foreground">
                  {video.title}
                </span>
                {video.note && (
                  <span className="mt-1.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                    {video.note}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {playing && (
        <div className="fixed inset-0 z-50 p-0 sm:p-6">
          <div
            className="absolute inset-0 bg-[var(--scrim)]"
            onClick={() => setPlaying(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={playing.title}
            className="modal-in relative mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden border border-border bg-surface sm:h-auto sm:rounded-lg"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                  {playing.title}
                </h3>
                {playing.note && (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {playing.note}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="pressable -mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Close the video"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.youtube_id}?rel=0&modestbranding=1&autoplay=1`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
