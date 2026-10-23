import Link from "next/link";

/**
 * The page the service worker shows when there is no network.
 *
 * It is deliberately the only page on the site with no database in it: the
 * worker precaches it at install time, and a fallback that needs the thing
 * that is missing is not a fallback. Keep it static.
 */

export const metadata = {
  title: "No connection · Cybersecurity 300L",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start px-5 py-20 sm:px-8 sm:py-28">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        Offline
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        No connection
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        This page needs the network. Check your signal and try again. The
        timetable and the course pages you have already visited will come back
        with it.
      </p>
      <Link
        href="/"
        className="pressable mt-8 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
      >
        Try the home page
      </Link>
    </div>
  );
}
