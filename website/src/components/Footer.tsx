import Link from "next/link";
import { ArrowUpRight, GitBranch, Download, Globe } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import PixelArt from "@/components/PixelArt";
import { resourceUrl, TIMETABLE_PDF, COURSES } from "@/lib/resources";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  download?: boolean;
}

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Study",
    links: [
      { label: "All courses", href: "/" },
      { label: "Timetable", href: "/timetable" },
      { label: "Registration", href: "/registration" },
      { label: "Study resources", href: "/resources" },
      { label: "Contact the reps", href: "/contact" },
    ],
  },
  {
    heading: "Session",
    links: [
      { label: "Calendar", href: "/timeline" },
      { label: "Timetable PDF", href: resourceUrl(TIMETABLE_PDF), download: true },
      {
        label: "Registration PDF",
        href: "/docs/300 Level CyberSecurity Course Registration List .pdf",
        download: true,
      },
      // Staff reach the attendance area from here. There is no link to it in
      // the navigation, because the navigation is for students and the
      // attendance area holds personal data.
      { label: "Staff area", href: "/admin" },
    ],
  },
  {
    heading: "Elsewhere",
    links: [
      { label: "thehood", href: "https://github.com/manofval0r/thehood", external: true },
      { label: "davidowu.tech", href: "https://davidowu.tech", external: true },
    ],
  },
];

export default function Footer() {
  const withFiles = COURSES.filter((c) => c.resources.length > 0).length;
  const totalFiles = COURSES.reduce((s, c) => s + c.resources.length, 0);

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border bg-surface">
      {/* The mark frames the right edge, held back so it never fights the links. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 right-0 hidden w-[260px] opacity-[0.07] lg:block"
      >
        <PixelArt className="h-auto w-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Identity */}
          <div className="max-w-md">
            <Wordmark size="lg" />
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
              Every lecture deck, lab manual and handout in the Cybersecurity
              300 Level programme. Files come straight from the course
              repository, so what a lecturer uploads is what a student downloads.
            </p>

            <dl className="mt-8 flex gap-10">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Courses
                </dt>
                <dd className="tnum mt-1 text-2xl font-bold text-foreground">
                  {COURSES.length}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  With files
                </dt>
                <dd className="tnum mt-1 text-2xl font-bold text-foreground">
                  {withFiles}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Files
                </dt>
                <dd className="tnum mt-1 text-2xl font-bold text-accent">
                  {totalFiles}
                </dd>
              </div>
            </dl>
          </div>

          {/* Link columns. The heading and its links share a left rail so
              each group reads as one unit; no panel or fill is added, the
              rule does the grouping. */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                  {col.heading}
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-border"
                  />
                </h3>
                <ul className="mt-3.5 space-y-0.5 border-l border-border pl-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.href.includes("github") ? (
                            <GitBranch size={13} className="opacity-60" />
                          ) : (
                            <Globe size={13} className="opacity-60" />
                          )}
                          {link.label}
                          <ArrowUpRight
                            size={12}
                            className="opacity-0 transition-opacity group-hover:opacity-70"
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          {...(link.download ? { download: true } : {})}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.download ? (
                            <Download size={13} className="opacity-60" />
                          ) : (
                            <span className="w-[13px]" />
                          )}
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar: the credit, given real weight */}
        <div className="flex flex-col gap-4 border-t border-border py-7 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-relaxed text-muted">
            Nigerian University of Technology and Management &middot;
            Department of Cybersecurity &middot; First Semester 2026/2027
          </p>

          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            <span>Built by</span>
            <a
              href="https://davidowu.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="pressable font-semibold text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
            >
              Valor
            </a>
            <span className="text-muted">/</span>
            <a
              href="https://github.com/manofval0r/thehood"
              target="_blank"
              rel="noopener noreferrer"
              className="pressable font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              manofval0r/thehood
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}