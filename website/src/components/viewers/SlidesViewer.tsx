"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Presentation,
  Loader2,
} from "lucide-react";
import { useFileBuffer } from "./use-file";

/**
 * A slide deck, rendered in the browser.
 *
 * A .pptx is a zip of XML. Rather than send the reader to some office
 * service to look at it, the file is opened here and drawn: the deck is
 * unzipped in the browser and each slide is laid out as HTML.
 *
 * It is not a perfect reproduction of PowerPoint. It is close enough to
 * read a lecture from, and it means a student on a phone with no PowerPoint
 * can still see what the lecturer put on the screen.
 */

interface Previewer {
  readonly slideCount: number;
  renderSingleSlide(index: number): void;
  renderNextSlide(): void;
  renderPreSlide(): void;
  destroy(): void;
}

/** The widest a slide is drawn. Past this the text gets soft. */
const MAX_WIDTH = 960;

export default function SlidesViewer({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const state = useFileBuffer(url);
  const hostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<Previewer | null>(null);
  const [slide, setSlide] = useState(0);
  const [count, setCount] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  const draw = useCallback(
    async (buffer: ArrayBuffer, width: number) => {
      const host = hostRef.current;
      if (!host) return;

      try {
        const { init } = await import("pptx-preview");
        if (!hostRef.current) return;

        // The library appends its own frame to the host and does not take it
        // away again, so the host is emptied first.
        host.replaceChildren();
        previewerRef.current?.destroy();

        const previewer = init(host, {
          width,
          height: Math.round(width * 0.75),
          mode: "slide",
        });
        previewerRef.current = previewer;

        await previewer.preview(buffer);
        setCount(previewer.slideCount);
        setSlide(0);
        setFailed(null);
      } catch {
        setFailed(
          "This deck could not be drawn here. Download it to open it in PowerPoint or Google Slides."
        );
      }
    },
    []
  );

  // Draw once the file has arrived.
  useEffect(() => {
    if (state.status !== "ready") return;
    const host = hostRef.current;
    if (!host) return;

    const width = Math.min(host.clientWidth || MAX_WIDTH, MAX_WIDTH);
    void draw(state.value, width);
  }, [state, draw]);

  // Draw again when the frame changes shape, but only when it changes
  // enough to be worth the work.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || state.status !== "ready") return;

    let last = Math.min(host.clientWidth || MAX_WIDTH, MAX_WIDTH);
    let timer: number | undefined;

    const observer = new ResizeObserver(() => {
      const width = Math.min(host.clientWidth || MAX_WIDTH, MAX_WIDTH);
      if (Math.abs(width - last) < 24) return;
      last = width;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (state.status === "ready") void draw(state.value, width);
      }, 200);
    });

    observer.observe(host);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [state, draw]);

  // Arrow keys move between slides, when the deck has the keyboard.
  useEffect(() => {
    if (!count) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const go = (step: number) => {
    const previewer = previewerRef.current;
    if (!previewer || !count) return;
    const next = (slide + step + count) % count;
    previewer.renderSingleSlide(next);
    setSlide(next);
  };

  const jump = (index: number) => {
    const previewer = previewerRef.current;
    if (!previewer) return;
    const next = Math.max(0, Math.min(count - 1, index));
    previewer.renderSingleSlide(next);
    setSlide(next);
  };

  const toggleFull = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch {
      // A browser that will not go full screen still shows the deck.
    }
  };

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[45vh] items-center justify-center p-16">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Opening the deck
        </span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 p-12 text-center">
        <Presentation size={44} className="text-muted" />
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <a
          href={url}
          download
          className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground max-sm:min-h-11"
        >
          <Download size={15} />
          Download instead
        </a>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-1 flex-col bg-background"
    >
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
        {failed ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-12 text-center">
            <Presentation size={44} className="text-muted" />
            <p className="max-w-sm text-sm text-muted-foreground">{failed}</p>
            <a
              href={url}
              download
              className="pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground max-sm:min-h-11"
            >
              <Download size={15} />
              Download instead
            </a>
          </div>
        ) : (
          <div ref={hostRef} className="pptx-host mx-auto w-full" />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!count}
            className="pressable flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
            aria-label="Previous slide"
          >
            <ChevronLeft size={17} />
          </button>

          <label className="flex items-center gap-1.5 px-1">
            <span className="sr-only">Slide number</span>
            <input
              type="number"
              min={1}
              max={Math.max(count, 1)}
              value={count ? slide + 1 : 0}
              onChange={(e) => jump(Number(e.target.value) - 1)}
              className="tnum w-12 rounded border border-border bg-surface px-2 py-1 text-center text-[12.5px] text-foreground outline-none focus-visible:border-accent max-sm:h-11 max-sm:w-14 max-sm:text-base"
            />
            <span className="tnum text-[12.5px] text-muted-foreground">
              of {count || "?"}
            </span>
          </label>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={!count}
            className="pressable flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30 max-sm:h-11 max-sm:w-11"
            aria-label="Next slide"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 hidden text-[11.5px] text-muted sm:inline">
            Arrow keys move between slides
          </span>
          <button
            type="button"
            onClick={toggleFull}
            className="pressable flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:h-11 max-sm:w-11"
            aria-label={full ? "Leave full screen" : "Full screen"}
          >
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <a
            href={url}
            download
            className="pressable flex h-8 items-center gap-1.5 rounded-md px-2 text-[11.5px] text-muted transition-colors hover:bg-surface-hover hover:text-foreground max-sm:h-11 max-sm:px-3"
          >
            <Download size={14} />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
