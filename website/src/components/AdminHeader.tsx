/**
 * The heading on every staff page.
 *
 * The staff area is a set of pages rather than one long page, so the heading
 * is the same shape on all of them: what this page is, in one line, before
 * anything else.
 */
export function AdminHeader({
  eyebrow = "Staff",
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="rise max-w-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        {lede}
      </p>
    </header>
  );
}
