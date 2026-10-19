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
}

interface Section {
  id: string;
  title: string;
  blurb: string;
  icon: typeof BookOpen;
  items: Link_[];
}

const SECTIONS: Section[] = [
  {
    id: "papers",
    title: "Research papers and reading",
    blurb:
      "Primary sources. Reading one paper well beats skimming ten, and these are the ones the field keeps citing.",
    icon: FileText,
    items: [
      {
        label: "Google Scholar",
        href: "https://scholar.google.com",
        note: "Search by course title or lecturer. Set an alert on your syllabus topics.",
      },
      {
        label: "arXiv cs.CR",
        href: "https://arxiv.org/list/cs.CR/recent",
        note: "Security and privacy preprints. Useful for Cryptography Techniques.",
      },
      {
        label: "IEEE Xplore",
        href: "https://ieeexplore.ieee.org",
        note: "Where most conference papers in this field are published.",
      },
      {
        label: "Semantic Scholar",
        href: "https://www.semanticscholar.org",
        note: "Citation graph, so you can walk backwards from a survey to its sources.",
      },
    ],
  },
  {
    id: "lectures",
    title: "Lecture channels",
    blurb:
      "Recorded material for the concepts that are hard to pick up from a slide alone.",
    icon: PlaySquare,
    items: [
      {
        label: "Computerphile",
        href: "https://youtube.com/@Computerphile",
        note: "Short, precise explainers on algorithms and data structures.",
      },
      {
        label: "Ben Eater",
        href: "https://youtube.com/@BenEater",
        note: "Building a computer from logic gates. Best for Digital Sovereignty.",
      },
      {
        label: "NetworkChuck",
        href: "https://youtube.com/@NetworkChuck",
        note: "Practical networking and tooling, worked through live.",
      },
      {
        label: "The Cyber Mentor",
        href: "https://youtube.com/@TheCyberMentor",
        note: "Ethical hacking fundamentals, defensive framing throughout.",
      },
      {
        label: "Neso Academy",
        href: "https://youtube.com/@NesoAcademy",
        note: "Formal language theory and automata. Covers the theory side of Data Structures.",
      },
    ],
  },
  {
    id: "practice",
    title: "Practice platforms",
    blurb:
      "Where the work actually happens. These are free or have a usable free tier.",
    icon: Laptop,
    items: [
      {
        label: "TryHackMe",
        href: "https://tryhackme.com",
        note: "Guided rooms, then unsupervised paths. Start with the Pre Security path.",
      },
      {
        label: "Hack The Box Academy",
        href: "https://academy.hackthebox.com",
        note: "Structured modules. The closer match to a degree practical course.",
      },
      {
        label: "PortSwigger Web Security Academy",
        href: "https://portswigger.net/web-security",
        note: "Free, and the best free material on web vulnerabilities.",
      },
      {
        label: "OverTheWire: Bandit",
        href: "https://overthewire.org/wargames/bandit/",
        note: "Linux command line, by doing. Good first contact for Digital Forensics.",
      },
      {
        label: "Google Cybersecurity Professional",
        href: "https://grow.google/cybersecurity",
        note: "Coursework and a certificate. Useful as structured revision.",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools and platforms",
    blurb:
      "Software the labs assume you already have, plus the ones worth learning now.",
    icon: Radio,
    items: [
      {
        label: "NotebookLM",
        href: "https://notebooklm.google.com",
        note: "Upload your own lecture PDFs and ask questions grounded in them. Cite-first answers.",
      },
      {
        label: "Autopsy / The Sleuth Kit",
        href: "https://www.autopsy.com",
        note: "Forensic disk imaging and analysis. Required reading for CYB 305.",
      },
      {
        label: "Wireshark",
        href: "https://www.wireshark.org",
        note: "Packet analysis. The single most-used tool in the lab.",
      },
      {
        label: "Nmap",
        href: "https://nmap.org",
        note: "Host and port discovery. Read the book, scan only what you are allowed to.",
      },
      {
        label: "OWASP Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org",
        note: "Dense, accurate reference material for the secure coding course.",
      },
    ],
  },
  {
    id: "route",
    title: "After the degree",
    blurb:
      "Only if you are curious now. Nothing here is needed for any course.",
    icon: GraduationCap,
    items: [
      {
        label: "RFC Editor",
        href: "https://www.rfc-editor.org",
        note: "Standards, read as literature. This is what the field actually argues from.",
      },
      {
        label: "NCC Group Research",
        href: "https://research.nccgroup.com",
        note: "Vendor-neutral applied security research, written clearly.",
      },
      {
        label: "CISA/NIST publications",
        href: "https://www.nist.gov/cybersecurity",
        note: "Frameworks and incident response guidance. Useful for policy roles.",
      },
    ],
  },
];

export default function ResourcesPage() {
  const coursesWithFiles = COURSES.filter((c) => c.resources.length > 0).length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
      </section>

      <nav aria-label="Sections" className="rise mb-12 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="pressable inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <s.icon size={13} />
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-20 pb-24">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                <section.icon size={16} className="text-accent" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  {section.blurb}
                </p>
              </div>
            </div>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-lift group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-hover"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[15px] font-semibold text-foreground">
                        {item.label}
                      </span>
                      <ArrowUpRight
                        size={15}
                        className="mt-0.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </span>
                    <span className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      {item.note}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="border-t border-border pb-20 pt-8 text-[13px] leading-relaxed text-muted-foreground">
        These are external sites and are not operated by the department. Nothing
        here is required for any course, and none of it is embedded here, so
        nothing third-party runs on this site.
      </p>
    </div>
  );
}
