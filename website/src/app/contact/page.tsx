import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { COURSES } from "@/lib/resources";
import {
  COURSE_REPS,
  repAddress,
  hasAnyAddress,
  isUnassigned,
  whatsappLink,
} from "@/lib/contact";
import Reveal from "@/components/Reveal";
import AppleCard from "@/components/AppleCard";

export const metadata: Metadata = {
  title: "Contact the course reps · Cybersecurity 300L",
  description:
    "Who teaches each course in the Cybersecurity 300 Level programme, when and where they teach it, and how to reach them.",
};

export default function ContactPage() {
  const core = COURSES.filter((c) => c.program === "Cybersecurity");
  const service = COURSES.filter((c) => c.program !== "Cybersecurity");
  const anyAddress = hasAnyAddress();

  const groups = [
    { title: "Core courses", note: "Taken by every student in the programme.", reps: core },
    {
      title: "Service courses",
      note: "Shared with students from other programmes.",
      reps: service,
    },
  ].filter((g) => g.reps.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="rise max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Who to ask
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Every course below lists the person who teaches it, from the same
          record the timetable is built from. Questions about a lecture, an
          assignment or a mark are quickest answered by that person directly.
        </p>
      </header>

      {/* ---------- The course representatives ---------- */}
      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Your course representatives
        </h2>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          The people elected to stand between the class and the department.
          Ask them about a lecture you missed, a registration problem, or a
          mark that looks wrong.
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COURSE_REPS.map((rep, i) => (
            <Reveal key={rep.email} delay={i * 60}>
              <li className="h-full">
                <AppleCard maxTilt={4} className="h-full">
                  <div className="card-tilt settle flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover">
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <p
                      className="card-depth text-[15px] font-semibold leading-snug text-foreground"
                      style={{ "--depth": "24px" } as React.CSSProperties}
                    >
                      {rep.name}
                    </p>
                    <p
                      className="card-depth mt-1 text-[12.5px] text-muted-foreground"
                      style={{ "--depth": "12px" } as React.CSSProperties}
                    >
                      {rep.role}
                    </p>

                    <div
                      className="card-depth mt-4 flex flex-col gap-2 border-t border-border pt-3"
                      style={{ "--depth": "6px" } as React.CSSProperties}
                    >
                      <a
                        href={`mailto:${rep.email}`}
                        className="pressable flex items-center gap-2 text-[12.5px] text-foreground transition-colors hover:text-accent"
                      >
                        <Mail size={13} className="shrink-0 text-accent" aria-hidden="true" />
                        <span className="truncate">{rep.email}</span>
                      </a>

                      <a
                        href={whatsappLink(
                          rep,
                          `Hello ${rep.name}, I have a question about the Cybersecurity 300 Level programme.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pressable flex items-center gap-2 text-[12.5px] text-foreground transition-colors hover:text-accent"
                      >
                        <MessageCircle
                          size={13}
                          className="shrink-0 text-accent"
                          aria-hidden="true"
                        />
                        <span className="truncate">{rep.whatsapp}</span>
                        <span className="shrink-0 text-[11px] text-muted">
                          ({rep.note})
                        </span>
                      </a>
                    </div>
                  </div>
                </AppleCard>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {!anyAddress && (
        <Reveal className="mt-10">
          <div className="flex gap-4 rounded-xl border border-border bg-surface p-5">
            <Mail size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">
                Lecturers do not have direct addresses published here
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                The reps above are the way in. A course lecturer can be reached
                through them, and they can pass a question on. An address is
                only published here when somebody is actually reading it.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      <div className="mt-12 space-y-14">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {group.title}
              </h2>
              <p className="text-[12.5px] text-muted-foreground">{group.note}</p>
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.reps.map((course) => {
                const address = repAddress(course.code);
                return (
                  <li key={course.slug}>
                    <AppleCard maxTilt={4} className="h-full">
                      {/* A div, not a Link: the mail action below is its own
                          anchor and anchors cannot nest. */}
                      <div className="card-tilt settle flex h-full flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover">
                        <span className="card-cast" aria-hidden="true" />
                        <span className="card-bevel" aria-hidden="true" />

                        <Link
                          href={`/courses/${course.slug}`}
                          className="card-depth group/card flex items-start justify-between gap-3"
                          style={{ "--depth": "16px" } as React.CSSProperties}
                        >
                          <p className="text-[14px] font-medium leading-snug text-foreground">
                            {course.title}
                          </p>
                          <ArrowRight
                            size={15}
                            className="mt-0.5 shrink-0 text-muted transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:text-foreground"
                            aria-hidden="true"
                          />
                        </Link>

                        <p
                          className="card-depth mt-2.5 text-[13px] text-muted-foreground"
                          style={{ "--depth": "8px" } as React.CSSProperties}
                        >
                          {isUnassigned(course.lecturer) ? (
                            <span className="text-muted">
                              Lecturer to be announced
                            </span>
                          ) : (
                            course.lecturer
                          )}
                        </p>

                        <div
                          className="card-depth mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[11.5px] text-muted"
                          style={{ "--depth": "4px" } as React.CSSProperties}
                        >
                          <span className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                            {course.code}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="opacity-70" aria-hidden="true" />
                            {course.day.split(" ").slice(0, 3).join(" ")}, {course.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="opacity-70" aria-hidden="true" />
                            {course.venue}
                          </span>
                        </div>

                        {address && !isUnassigned(course.lecturer) && (
                          <a
                            href={`mailto:${address}?subject=${encodeURIComponent(
                              `${course.code} - ${course.title}`
                            )}`}
                            className="pressable card-depth mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover"
                            style={{ "--depth": "6px" } as React.CSSProperties}
                          >
                            <Mail size={12} className="text-accent" aria-hidden="true" />
                            Email the rep
                          </a>
                        )}
                      </div>
                    </AppleCard>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-border pt-8">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Where the course materials come from
        </h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Lecture notes and lab manuals on this site are the ones lecturers
          have published here. If a deck you were told about in class is not
          listed on the{" "}
          <Link
            href="/courses"
            className="text-foreground underline underline-offset-2 hover:text-accent"
          >
            course pages
          </Link>
          , the rep above is the person to ask.
        </p>
      </section>
    </div>
  );
}