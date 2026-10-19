import Link from "next/link";
import { Download } from "lucide-react";
import { COURSES, resourceUrl, REGISTRATION_PDF } from "@/lib/resources";
import PrintButton from "@/components/PrintButton";
import AppleCard from "@/components/AppleCard";
import { cn } from "@/lib/utils";
import { TableFrame, DataTable, Thead, Th, Tr, Td } from "@/components/ui/table";

export const metadata = {
  title: "Course Registration · Cybersecurity 300L",
  description: "First Semester 2026/2027 course registration list for the Cybersecurity 300 Level programme.",
};

export default function RegistrationPage() {
  const totalUnits = COURSES.reduce((s, c) => s + c.units, 0);
  const core = COURSES.filter((c) => c.program === "Cybersecurity");
  const service = COURSES.filter((c) => c.program !== "Cybersecurity");
  const coreUnits = core.reduce((s, c) => s + c.units, 0);
  const serviceUnits = service.reduce((s, c) => s + c.units, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* Identifies the sheet once it is loose from the site. */}
      <div className="print-only mb-6 border-b border-border pb-4">
        <p className="text-[10pt] font-bold uppercase tracking-[0.12em]">
          Nigerian University of Technology and Management
        </p>
        <p className="mt-1 text-[9pt] text-muted-foreground">
          Department of Cybersecurity &middot; Course Registration &middot; First
          Semester 2026/2027
        </p>
      </div>

      {/* Header */}
      <section className="rise pb-8 pt-14 md:pt-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Course Registration
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              First Semester 2026/2027 &middot; {totalUnits} units across {COURSES.length} courses.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2.5 self-start">
            <a
              href={resourceUrl(REGISTRATION_PDF)}
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

      {/* Unit summary. These tilt like the course cards do; the tilt is the
          one motion the whole site shares, so the same gesture means the same
          thing wherever a card appears. The registration table below stays
          flat on purpose: a data grid that leans is a grid you cannot scan. */}
      <section
        className="rise mb-8 grid gap-4 sm:grid-cols-3"
        style={{ animationDelay: "60ms" }}
      >
        {[
          {
            label: "Cybersecurity core",
            value: coreUnits,
            note: `${core.length} courses`,
            tone: "",
          },
          {
            label: "COS/CYB service",
            value: serviceUnits,
            note: `${service.length} courses`,
            tone: "",
          },
          {
            label: "Total load",
            value: totalUnits,
            note: "units this semester",
            tone: "border-accent/40 bg-accent/5",
          },
        ].map((stat) => (
          <AppleCard key={stat.label} maxTilt={5} className="h-full">
            <div
              className={`card-tilt settle h-full rounded-lg border border-border bg-surface p-5 ${stat.tone}`}
            >
              <span className="card-cast" aria-hidden="true" />
              <span className="card-accent-glow" aria-hidden="true" />
              <span className="card-bevel" aria-hidden="true" />

              <p
                className={cn(
                  "card-depth text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground",
                  stat.tone && "text-accent"
                )}
              >
                {stat.label}
              </p>
              <p
                className="card-depth tnum mt-2 text-3xl font-bold text-foreground"
                style={{ "--depth": "26px" } as React.CSSProperties}
              >
                {stat.value}
              </p>
              <p
                className="card-depth mt-1 text-[13px] text-muted-foreground"
                style={{ "--depth": "14px" } as React.CSSProperties}
              >
                {stat.note}
              </p>
            </div>
          </AppleCard>
        ))}
      </section>

      {/* Table */}
      <section className="rise" style={{ animationDelay: "120ms" }}>
        <TableFrame>
          <DataTable>
            <Thead>
              <Th width="3.5rem" align="right">
                #
              </Th>
              <Th width="9rem">Code</Th>
              <Th>Course title</Th>
              <Th width="6rem">Programme</Th>
              <Th width="5rem" align="right">
                Units
              </Th>
              <Th width="7rem" align="right">
                Files
              </Th>
            </Thead>
            <tbody>
              {COURSES.map((c, i) => {
                const count = c.resources.length;
                return (
                  <Tr key={c.code}>
                    <Td numeric align="right" className="text-muted">
                      {i + 1}
                    </Td>
                    <Td>
                      <Link
                        href={`/courses/${c.slug}`}
                        className="pressable rounded font-mono text-[12px] font-bold text-accent underline-offset-4 hover:underline"
                      >
                        {c.code}
                      </Link>
                    </Td>
                    <Td strong className="min-w-[18rem]">
                      {c.title}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {c.program === "Cybersecurity" ? (
                        <span className="text-foreground">Cybersecurity</span>
                      ) : (
                        c.program
                      )}
                    </Td>
                    <Td numeric align="right" strong>
                      {c.units}
                    </Td>
                    <Td numeric align="right">
                      {/* A muted 0, not a dash. In a right-aligned numeric
                          column a dash reads as "not applicable" when it
                          plainly means "none yet", and this column is
                          always applicable. */}
                      {count > 0 ? (
                        <span className="text-foreground">{count}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
              <tr className="border-t border-border-strong bg-surface-raised">
                <td colSpan={4} className="px-4 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-foreground">
                  Total
                </td>
                <Td numeric align="right" strong>
                  {totalUnits}
                </Td>
                <td />
              </tr>
            </tbody>
          </DataTable>
        </TableFrame>
        <p className="mt-4 text-[13px] text-muted-foreground">
          Course codes link to that course&rsquo;s resource page. A dash in the
          files column means a lecturer hasn&rsquo;t uploaded anything yet.
        </p>
      </section>
    </div>
  );
}