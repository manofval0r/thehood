"use client";

import * as React from "react";

/**
 * Reveals its children once, when they first scroll into view.
 *
 * The calendar has 55 rows; a page-load stagger would fire all of them at
 * once. This uses one IntersectionObserver per element and disconnects
 * after the first hit, so nothing keeps watching.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.shown = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = "true";
            io.unobserve(e.target);
          }
        }
      },
      // Start revealing slightly before the element reaches the fold.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cnJoin("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

function cnJoin(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export default Reveal;