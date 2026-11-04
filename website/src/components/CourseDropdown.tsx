"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { CourseOption } from "@/components/CoursePicker";
import { cn } from "@/lib/utils";

/**
 * A custom-styled course dropdown that replaces the native <select>.
 *
 * Matches the site's dark terminal aesthetic: surface background, hairline
 * border, green accent on the active item, and a smooth fade/slide reveal.
 * Fully keyboard navigable: open with Enter/Space, move with the arrow keys,
 * select with Enter, close with Escape.
 */
export default function CourseDropdown({
  courses,
  value,
  onChange,
}: {
  courses: CourseOption[];
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const current = courses.find((c) => c.code === value) ?? courses[0];
  const highlightedIndex = React.useMemo(
    () => courses.findIndex((c) => c.code === courses[highlighted]?.code),
    [courses, highlighted]
  );

  React.useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const item = listRef.current?.querySelector<HTMLLIElement>(
      `[data-index="${highlightedIndex}"]`
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [open, highlightedIndex]);

  const close = () => setOpen(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (open) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlighted((h) => Math.min(h + 1, courses.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const code = courses[highlighted]?.code;
        if (code && code !== value) {
          onChange(code);
        }
        close();
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="relative w-full sm:w-72">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="pressable flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground outline-none focus-visible:border-accent transition-colors hover:border-border-strong"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex-shrink-0 text-accent">{current.code}</span>
          <span className="truncate">{current.title}</span>
        </span>
        <ChevronDown
          size={13}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border border-border-strong bg-surface shadow-lift animate-[fadeIn_220ms_ease-out]"
        >
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto divide-y divide-border"
          >
            {courses.map((course, index) => {
              const active = course.code === value;
              return (
                <li
                  key={course.code}
                  data-index={index}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseMove={() => setHighlighted(index)}
                  onClick={() => {
                    if (course.code !== value) onChange(course.code);
                    close();
                  }}
                  className={cn(
                    "pressable flex w-full items-center gap-2 px-3 py-2.5 text-[12.5px] transition-colors",
                    active
                      ? "bg-accent/10 text-accent font-semibold border-l-2 border-accent"
                      : highlighted === index
                        ? "bg-surface-hover text-foreground"
                        : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <span className="truncate">{course.title}</span>
                  <span className="flex-shrink-0 font-mono text-[10.5px] text-muted">
                    {course.code}
                  </span>
                  {active && (
                    <span className="ml-auto w-4 h-4 shrink-0">
                      <svg className="w-full h-full text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
