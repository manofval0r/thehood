import { Fragment } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { COURSES, resourceUrl, TIMETABLE_PDF } from "@/lib/resources";
import { TableFrame, DataTable, Thead, Th, Tr, Td, DayGroup } from "@/components/ui/table";
import NoteArt from "@/components/NoteArt";
import PrintButton from "@/components/PrintButton";
import Reveal from "@/components/Reveal";

const VENUES: [string, number][] = [
  ["Cybersecurity Lab", 5],
  ["PG 2", 3],
  ["Software Lab", 1],
];

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface Slot {
  time: string;
  code: string;
  title: string;
  units: string;
  level: string;
  program: string;
  venue: string;
  lecturer: string;
}

const SLOTS: Slot[] = [
  { time: "1:00pm - 4:00pm", code: "NUT-CYB 312", title: "Secure Coding", units: "3", level: "300", program: "Cyber-Security", venue: "Cybersecurity Lab", lecturer: "Dr Faki" },
  { time: "9:00am - 11:00am", code: "NUT-MAN 315", title: "Marketing Management", units: "2", level: "300", program: "COS/CYB", venue: "PG 2", lecturer: "Dr Ebes" },
  { time: "12:00pm - 2:00pm", code: "NUT-CSC 301", title: "Digital Sovereignty", units: "2", level: "300", program: "COS/CYB", venue: "PG 2", lecturer: "Prof Sinjay" },
  { time: "3:00pm - 5:00pm", code: "GST 312", title: "Peace and Conflict Resolution", units: "2", level: "300", program: "COS/CYB", venue: "PG 2", lecturer: "Ikechukwu Alamezie" },
  { time: "9:00am - 12:00pm", code: "NUT-CSC 312", title: "Data Structures", units: "3", level: "300", program: "COS/CYB", venue: "Software Lab", lecturer: "Jeremiah Ocheni" },
  { time: "12:30pm - 2:30pm", code: "CYB 305", title: "Digital Forensics and Investigation Methods", units: "2", level: "300", program: "Cyber-Security", venue: "Cybersecurity Lab", lecturer: "Dr Segun" },
  { time: "3:00pm - 5:00pm", code: "CYB 303", title: "Cybersecurity Risks Analysis, Challenges and Mitigation", units: "2", level: "300", program: "Cyber-Security", venue: "Cybersecurity Lab", lecturer: "Dr Faki" },
  { time: "9:00am - 12:00pm", code: "NUT-CSC 310", title: "Distributed System Security", units: "3", level: "300", program: "Cyber-Security", venue: "Cybersecurity Lab", lecturer: "Pending" },
  { time: "12:30pm - 2:30pm", code: "CYB 301", title: "Cryptography Techniques, Algorithms and Applications", units: "2", level: "300", program: "Cyber-Security", venue: "Cybersecurity Lab", lecturer: "Dr Steve" },
  { time: "3:00pm - 5:00pm", code: "CSC 309", title: "Artificial Intelligence", units: "2", level: "300", program: "COS/CYB", venue: "Cybersecurity Lab", lecturer: "Charles Igah" },
];

const ORDERED: Record<string, Slot[]> = {
  Monday: [SLOTS[0]],
  Tuesday: [SLOTS[1], SLOTS[2], SLOTS[3]],
  Wednesday: [SLOTS[4], SLOTS[5], SLOTS[6]],
  Thursday: [SLOTS[7], SLOTS[8], SLOTS[9]],
};

function slugFor(code: string) {
  return COURSES.find((c) => c.code === code)?.slug;
}

export const metadata = {
  title: "Timetable · Cyber-Security 300L",
  description: "First Semester 2026/2027 weekly timetable for the Cyber-Security 300 Level programme.",
};

export default function TimetablePage() {
  const totalUnits = COURSES.reduce((s, c) => s + c.units, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Identifies the sheet once it is loose from the site. */}
      <div className="print-only mb-6 border-b border-border pb-4">
        <p className="text-[10pt] font-bold uppercase tracking-[0.12em]">
          Nigerian University of Technology and Management
        </p>
        <p className="mt-1 text-[9pt] text-muted-foreground">
          Department of Cyber-Security &middot; First Semester 2026/2027
        </p>
      </div>

      {/* Header */}
      <section className="rise pb-8 pt-14 md:pt-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
              First Semester Timetable
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              2026/2027 session. Every course code links to its resources page.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2.5 self-start">
            <a
              href={resourceUrl(TIMETABLE_PDF)}
              download
              className="print-hide pressable inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Download size={15} />
              Download PDF
            </a>
            <PrintButton />
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="rise" style={{ animationDelay: "80ms" }}>
        <TableFrame>
          <DataTable>
            <Thead>
              <Th width="8rem">Time</Th>
              <Th width="9rem">Code</Th>
              <Th>Course</Th>
              <Th width="5rem" align="right">
                Units
              </Th>
              <Th width="9rem">Venue</Th>
              <Th width="9rem">Lecturer</Th>
            </Thead>
            <tbody>
              {DAY_ORDER.map((day) => {
                const slots = ORDERED[day];
                if (!slots) return null;
                return (
                  <Fragment key={day}>
                    <DayGroup count={slots.length}>{day}</DayGroup>
                    {slots.map((s) => {
                      const slug = slugFor(s.code);
                      return (
                        <Tr key={s.code}>
                          <Td numeric className="whitespace-nowrap font-medium text-foreground">
                            {s.time}
                          </Td>
                          <Td>
                            {slug ? (
                              <Link
                                href={`/courses/${slug}`}
                                className="pressable rounded font-mono text-[12px] font-bold text-accent underline-offset-4 hover:underline"
                              >
                                {s.code}
                              </Link>
                            ) : (
                              <span className="font-mono text-[12px] font-bold text-foreground">
                                {s.code}
                              </span>
                            )}
                          </Td>
                          <Td strong className="min-w-[16rem]">
                            {s.title}
                          </Td>
                          <Td numeric align="right">
                            {s.units}
                          </Td>
                          <Td className="whitespace-nowrap">{s.venue}</Td>
                          <Td className="whitespace-nowrap">{s.lecturer}</Td>
                        </Tr>
                      );
                    })}
                  </Fragment>
                );
              })}
              <tr className="border-t border-border-strong bg-surface-raised">
                <td colSpan={3} className="px-4 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-foreground">
                  Total registered
                </td>
                <Td numeric align="right" strong>
                  {totalUnits}
                </Td>
                <td colSpan={2} className="px-4 py-3.5 text-[12px] text-muted-foreground">
                  units across {COURSES.length} courses
                </td>
              </tr>
            </tbody>
          </DataTable>
        </TableFrame>
      </section>

      {/* ---------- Notes, each with its own illustration ---------- */}
      <section className="grid gap-5 py-20 md:grid-cols-3">
        <NoteCard
          variant="calendar"
          title="Friday is free"
          body="No lectures are scheduled. It is the one full day you get back for revision, lab work, or reading ahead."
        />
        <NoteCard
          variant="plan"
          title="Three venues"
          body="Every class is in the Cybersecurity Lab, the Software Lab, or PG 2."
        >
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-[13px]">
            {VENUES.map(([name, n]) => (
              <div key={name} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{name}</dt>
                <dd className="tnum text-foreground">{n}</dd>
              </div>
            ))}
          </dl>
        </NoteCard>
        <NoteCard
          variant="plate"
          title="Still unassigned"
          body="Distributed System Security has no lecturer on the timetable yet. Confirm with the department before your first Thursday class."
        />
      </section>
    </div>
  );
}

function NoteCard({
  variant,
  title,
  body,
  children,
}: {
  variant: "calendar" | "plan" | "plate";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className="card-lift flex flex-col rounded-lg border border-border bg-surface p-6">
      <div className="mb-7 w-28">
        <NoteArt variant={variant} />
      </div>
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </Reveal>
  );
}