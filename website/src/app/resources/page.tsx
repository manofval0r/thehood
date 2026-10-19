import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  GraduationCap,
  Laptop,
  PlaySquare,
  Radio,
} from "lucide-react";
import { COURSES } from "@/lib/resources";
import AppleCard from "@/components/AppleCard";
import ResourceMark, { KIND_STYLE, domainOf, type Kind } from "@/components/ResourceMark";

export const metadata: Metadata = {
  title: "Study Resources · Cybersecurity 300L",
  description:
    "Research papers, lecture channels, practice platforms and tools that support the Cybersecurity 300 Level programme.",
};

/**
 * External study resources.
 *
 * Kept as plain data with no runtime fetching: a feed would fail on the
 * network and leave a student staring at an empty section, and every link here
 * is stable enough to name outright. Links go out with rel=noopener, and every
 * one is a destination the student leaves for, never something embedded, so
 * nothing third-party loads on this origin.
 */

interface Link_ {
  label: string;
  href: string;
  note: string;
  /** What kind of thing this is, which decides its mark and its tag. */
  kind: Kind;
}

interface Section {
  id: string;
  title: string;
  blurb: string;
  icon: typeof BookOpen;
  /** One of the calendar's category tones, so the five sections are told
   *  apart by a glance down the page rather than by reading their headings. */
  tone: "academic" | "exams" | "holiday" | "statutory" | "ceremony";
  items: Link_[];
}

const SECTIONS: Section[] = [
  {
    id: "papers",
    title: "Research papers and reading",
    blurb:
      "Primary sources. Reading one paper well beats skimming ten, and these are the ones the field keeps citing.",
    icon: FileText,
    tone: "academic",
    items: [
      {
        label: "Google Scholar",
        href: "https://scholar.google.com",
        note: "Search by course title or lecturer. Set an alert on your syllabus topics.",
        kind: "search",
      },
      {
        label: "arXiv cs.CR",
        href: "https://arxiv.org/list/cs.CR/recent",
        note: "Security and privacy preprints. Useful for Cryptography Techniques.",
        kind: "journal",
      },
      {
        label: "IEEE Xplore",
        href: "https://ieeexplore.ieee.org",
        note: "Where most conference papers in this field are published.",
        kind: "journal",
      },
      {
        label: "Semantic Scholar",
        href: "https://www.semanticscholar.org",
        note: "Citation graph, so you can walk backwards from a survey to its sources.",
        kind: "search",
      },
    ],
  },
  {
    id: "lectures",
    title: "Lecture channels",
    blurb:
      "Recorded material for the concepts that are hard to pick up from a slide alone.",
    icon: PlaySquare,
    tone: "ceremony",
    items: [
      {
        label: "Computerphile",
        href: "https://youtube.com/@Computerphile",
        note: "Short, precise explainers on algorithms and data structures.",
        kind: "video",
      },
      {
        label: "Ben Eater",
        href: "https://youtube.com/@BenEater",
        note: "Building a computer from logic gates. Best for Digital Sovereignty.",
        kind: "video",
      },
      {
        label: "NetworkChuck",
        href: "https://youtube.com/@NetworkChuck",
        note: "Practical networking and tooling, worked through live.",
        kind: "video",
      },
      {
        label: "The Cyber Mentor",
        href: "https://youtube.com/@TheCyberMentor",
        note: "Ethical hacking fundamentals, defensive framing throughout.",
        kind: "video",
      },
      {
        label: "Neso Academy",
        href: "https://youtube.com/@NesoAcademy",
        note: "Formal language theory and automata. Covers the theory side of Data Structures.",
        kind: "video",
      },
    ],
  },
  {
    id: "practice",
    title: "Practice platforms",
    blurb:
      "Where the work actually happens. These are free or have a usable free tier.",
    icon: Laptop,
    tone: "exams",
    items: [
      {
        label: "TryHackMe",
        href: "https://tryhackme.com",
        note: "Guided rooms, then unsupervised paths. Start with the Pre Security path.",
        kind: "practice",
      },
      {
        label: "Hack The Box Academy",
        href: "https://academy.hackthebox.com",
        note: "Structured modules. The closer match to a degree practical course.",
        kind: "practice",
      },
      {
        label: "PortSwigger Web Security Academy",
        href: "https://portswigger.net/web-security",
        note: "Free, and the best free material on web vulnerabilities.",
        kind: "practice",
      },
      {
        label: "OverTheWire: Bandit",
        href: "https://overthewire.org/wargames/bandit/",
        note: "Linux command line, by doing. Good first contact for Digital Forensics.",
        kind: "practice",
      },
      {
        label: "Google Cybersecurity Professional",
        href: "https://grow.google/cybersecurity",
        note: "Coursework and a certificate. Useful as structured revision.",
        kind: "course",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools and platforms",
    blurb:
      "Software the labs assume you already have, plus the ones worth learning now.",
    icon: Radio,
    tone: "statutory",
    items: [
      {
        label: "NotebookLM",
        href: "https://notebooklm.google.com",
        note: "Upload your own lecture PDFs and ask questions grounded in them. Cite-first answers.",
        kind: "notebook",
      },
      {
        label: "Autopsy / The Sleuth Kit",
        href: "https://www.autopsy.com",
        note: "Forensic disk imaging and analysis. Required reading for CYB 305.",
        kind: "tool",
      },
      {
        label: "Wireshark",
        href: "https://www.wireshark.org",
        note: "Packet analysis. The single most-used tool in the lab.",
        kind: "tool",
      },
      {
        label: "Nmap",
        href: "https://nmap.org",
        note: "Host and port discovery. Read the book, scan only what you are allowed to.",
        kind: "tool",
      },
      {
        label: "OWASP Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org",
        note: "Dense, accurate reference material for the secure coding course.",
        kind: "reference",
      },
    ],
  },
  {
    id: "route",
    title: "After the degree",
    blurb:
      "Only if you are curious now. Nothing here is needed for any course.",
    icon: GraduationCap,
    tone: "holiday",
    items: [
      {
        label: "RFC Editor",
        href: "https://www.rfc-editor.org",
        note: "Standards, read as literature. This is what the field actually argues from.",
        kind: "reference",
      },
      {
        label: "NCC Group Research",
        href: "https://research.nccgroup.com",
        note: "Vendor-neutral applied security research, written clearly.",
        kind: "journal",
      },
      {
        label: "CISA/NIST publications",
        href: "https://www.nist.gov/cybersecurity",
        note: "Frameworks and incident response guidance. Useful for policy roles.",
        kind: "journal",
      },
    ],
  },
];

export default function ResourcesPage() {
  const coursesWithFiles = COURSES.filter((c) => c.resources.length > 0).length;
  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0);

  /** How many of each kind there are, for the reader scanning the page. */
  const byKind = SECTIONS.flatMap((s) => s.items).reduce(
    (acc, i) => {
      acc[i.kind] = (acc[i.kind] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<Kind, number>>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="rise pb-10 pt-14 md:pt-20">
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight text-foreground md:text-5xl">
          Study resources
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Everything here is outside the programme itself: papers, channels,
          practice platforms and tools. Course files stay on the{" "}
          <Link href="/" className="text-accent underline underline-offset-4 hover:no-underline">
            course pages
          </Link>
          , where {coursesWithFiles} of {COURSES.length} courses have material
          uploaded so far.
        </p>

        {/* What kind of thing each entry is, before any of them. A reader
            arrives with a question rather than a subject, and this is the one
            line that answers "which of these do I want". */}
        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-5">
          {(Object.keys(byKind) as Kind[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: KIND_STYLE[k].bg }}
              >
                <span className="h-[20px] w-[20px]">
                  <ResourceMark kind={k} />
                </span>
              </span>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                  {KIND_STYLE[k].label}
                </dt>
                <dd className="tnum text-[12px] text-muted-foreground">
                  {byKind[k]}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="Sections" className="rise mb-16 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="pressable inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: `var(--tone-${s.tone})` }}
              aria-hidden="true"
            />
            {s.title}
            <span className="tnum text-muted">{s.items.length}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-24 pb-24">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            {/* The section's tone runs down its left edge, so the page reads
                as five bands rather than one long undifferentiated list. */}
            <div
              className="border-l-2 pl-6"
              style={{ borderColor: `var(--tone-${section.tone})` }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `color-mix(in srgb, var(--tone-${section.tone}) 15%, transparent)`,
                    color: `var(--tone-${section.tone})`,
                  }}
                >
                  <section.icon size={17} />
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <span className="tnum text-[13px] text-muted">
                  {section.items.length} links
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {section.blurb}
              </p>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => {
                const kind = KIND_STYLE[item.kind];
                return (
                  <li key={item.href} className="h-full">
                    <AppleCard maxTilt={5} className="h-full">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-tilt settle group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-hover"
                      >
                        <span className="card-cast" aria-hidden="true" />
                        <span className="card-bevel" aria-hidden="true" />

                        {/* The mark sits in a tinted tile rather than loose in a
                            corner, so twenty-odd cards stay tellable apart at
                            a glance instead of reading as one texture. */}
                        <span className="card-depth flex items-start justify-between gap-3">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: kind.bg }}
                          >
                            <span className="h-6 w-6">
                              <ResourceMark kind={item.kind} />
                            </span>
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                            style={{ background: kind.bg, color: kind.fg }}
                          >
                            {kind.label}
                          </span>
                        </span>

                        <span className="card-depth mt-4 text-[15px] font-semibold leading-snug text-foreground">
                          {item.label}
                        </span>

                        <span
                          className="card-depth mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground"
                          style={{ "--depth": "24px" } as React.CSSProperties}
                        >
                          {item.note}
                        </span>

                        {/* The domain, so it is obvious at a glance that every
                            one of these leaves the site. */}
                        <span className="card-depth mt-5 flex items-center justify-between gap-2 border-t border-border pt-3.5">
                          <span className="truncate font-mono text-[11px] text-muted">
                            {domainOf(item.href)}
                          </span>
                          <ArrowUpRight
                            size={14}
                            className="shrink-0 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                          />
                        </span>
                      </a>
                    </AppleCard>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="border-t border-border pb-20 pt-8 text-[13px] leading-relaxed text-muted-foreground">
        These are external sites and are not operated by the department. Nothing
        here is required for any course, and none of it is embedded here, so
        nothing third-party runs on this site. The marks above are drawn rather
        than fetched, for the same reason: {total} favicon requests would tell
        every one of these sites who was reading.
      </p>
    </div>
  );
}