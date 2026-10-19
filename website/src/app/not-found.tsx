import Link from "next/link";
import { Search, CalendarDays, LayoutGrid } from "lucide-react";

const SUGGESTIONS = [
  {
    href: "/",
    icon: LayoutGrid,
    title: "All courses",
    body: "Every registered course in the programme, with whatever files have been uploaded.",
  },
  {
    href: "/timetable",
    icon: Search,
    title: "Timetable",
    body: "Weekly schedule with venues, lecturers and times for each course.",
  },
  {
    href: "/timeline",
    icon: CalendarDays,
    title: "Academic calendar",
    body: "The 2026/2027 session, with a draggable timeline and category filters.",
  },
];

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-[13px] text-accent">404</p>
      <h1 className="mt-4 max-w-xl text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.02] tracking-tight text-foreground">
        That page is not on the timetable.
      </h1>
      <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
        The address you followed does not match any course, page or file here.
        If a lecturer shared a link, it may have moved.
      </p>

      <div className="mt-12 w-full">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Try one of these
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {SUGGESTIONS.map(({ href, icon: Icon, title, body }) => (
            <li key={href}>
              <Link
                href={href}
                className="card-lift block h-full rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-hover"
              >
                <Icon size={17} className="text-accent" />
                <h2 className="mt-3 text-[14px] font-semibold text-foreground">
                  {title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
        Looking for a specific file? Search from the homepage finds individual
        resources as well as courses, so you can go straight to a lecture note
        without opening the course first.
      </p>
    </div>
  );
}
