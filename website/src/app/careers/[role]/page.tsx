import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppleCard from "@/components/AppleCard";
import PixelMotif from "@/components/PixelMotif";
import Reveal from "@/components/Reveal";
import {
  ROLES,
  certsForRole,
  getRole,
  platformsForRole,
} from "@/lib/career";
import { COURSES } from "@/lib/resources";

/**
 * One role, in depth.
 *
 * The part that makes it worth opening is the courses: this page says which
 * of the lectures on this site feed the job, and links to each one. That is
 * the connection a student cannot make on their own, because the job title
 * and the course code look like unrelated things until somebody points at
 * both.
 */

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }));
}

// This route is allowed to block instead of prerendering a static shell.
// The page is generated for every role, but the nav reads the pathname in a
// client component, and the role metadata awaits its params. Under Cache
// Components both of those are request-time work, so the route opts out of
// the static-shell check the same way the course and viewer routes do.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const found = getRole(role);
  if (!found) return { title: "Role not found · Cybersecurity 300L" };
  return {
    title: `${found.title} · Careers · Cybersecurity 300L`,
    description: found.summary,
  };
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const found = getRole(role);
  if (!found) notFound();

  const courses = found.courses
    .map((slug) => COURSES.find((c) => c.slug === slug))
    .filter((c): c is (typeof COURSES)[number] => Boolean(c));

  const certs = certsForRole(found);
  const platforms = platformsForRole(found);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <Link
        href="/careers"
        className="text-[12.5px] text-muted transition-colors hover:text-foreground"
      >
        ← All the jobs
      </Link>

      <header className="rise mt-4 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-black">
          <PixelMotif kind={found.motif} title={found.title} className="h-10 w-10" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            A job in security
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {found.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            {found.summary}
          </p>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          The work
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {found.work}
        </p>
      </section>

      {/* The courses. This is the point of the page. */}
      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          The courses here that feed it
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {courses.length} of the ten courses on this programme go into this
          job.
        </p>

        <ul className="mt-4 space-y-2">
          {courses.map((c) => (
            <Reveal key={c.slug}>
              <li>
                <Link
                  href={`/courses/${c.slug}`}
                  className="pressable flex items-baseline gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
                >
                  <span className="w-28 shrink-0 font-mono text-[12px] text-muted">
                    {c.code}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-foreground">
                    {c.title}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {c.lecturer}
                  </span>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* How to get in */}
      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          How to get in
        </h2>
        <ol className="mt-4 space-y-3">
          {found.path.map((step, i) => (
            <Reveal key={step} delay={i * 40}>
              <li className="flex gap-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded border border-border bg-surface font-mono text-[11px] text-muted">
                  {i + 1}
                </span>
                <span className="text-[14px] leading-relaxed text-muted-foreground">
                  {step}
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Certifications */}
      {certs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Certifications that count
          </h2>
          <ul className="mt-4 space-y-2">
            {certs.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="text-[14px] font-semibold text-foreground">
                    {c.name}
                  </span>
                  <span className="text-[12px] text-muted">{c.vendor}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {c.level}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {c.proves}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  <span className="text-muted-foreground">Cost.</span> {c.cost}.{" "}
                  <span className="text-muted-foreground">Pay less.</span>{" "}
                  {c.cheaper}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Practice */}
      {platforms.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Where to practise
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {platforms.map((p) => (
              <li key={p.id}>
                <AppleCard maxTilt={4} className="h-full">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-tilt settle relative flex h-full flex-col rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-hover"
                  >
                    <span className="card-cast" aria-hidden="true" />
                    <span className="card-accent-glow" aria-hidden="true" />
                    <span className="card-bevel" aria-hidden="true" />

                    <span className="card-depth text-[14px] font-semibold text-foreground">
                      {p.name}
                    </span>
                    <span className="card-depth mt-1 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {p.what}
                    </span>
                    <span className="card-depth mt-2 text-[11.5px] font-medium text-accent">
                      {p.price}
                    </span>
                  </a>
                </AppleCard>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* What gets you through the door */}
      <section className="mt-12 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
          What actually gets you through the door
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {found.signal}
        </p>
      </section>

      {/* The other jobs */}
      <section className="mt-12">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
          Other jobs
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {ROLES.filter((r) => r.slug !== found.slug).map((r) => (
            <li key={r.slug}>
              <Link
                href={`/careers/${r.slug}`}
                className="pressable inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <PixelMotif kind={r.motif} title="" className="h-3.5 w-3.5" />
                {r.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
