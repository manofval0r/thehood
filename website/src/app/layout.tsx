import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ThemeProvider, THEME_BOOTSTRAP } from "@/components/ThemeProvider";
import { StaffSessionProvider } from "@/components/StaffSession";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ScheduleProvider } from "@/components/ScheduleProvider";
import ThemePill from "@/components/ThemePill";
import CountdownPill from "@/components/CountdownPill";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getAllBreaks } from "@/lib/break-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cybersecurity 300L · Course Resources",
  description:
    "Course resources for the Cybersecurity 300 Level programme, First Semester 2026/2027, Nigerian University of Technology and Management.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The breaks inside each lecture. The countdown and the timetable both
  // need them, and both run in the browser, so they are read once here and
  // handed down. Cached, so this costs the same on every page.
  const breaks = await getAllBreaks();

  return (
    <html
      lang="en"
      // The bootstrap script in <head> sets data-theme before first paint,
      // using localStorage or the OS preference. No server-side default avoids
      // a hydration mismatch where React would revert the script's correct value.
      suppressHydrationWarning
      className={`${GeistSans.variable} h-full antialiased`}
    >
      <head>
        {/*
          Sets the theme before first paint. Deferred, this would flash dark on
          every navigation to a light-mode reader. Inlined rather than bundled
          because a separate chunk is, by definition, a later chunk.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-clip">
        {/*
          Icons. Every `sizes` here must match a file that actually exists;
          a browser is entitled to act on a wrong one. This set was
          declaring sizes="48x48" for a 64x64 file and shipping no .ico at
          all, so anything that ignores the link tags fell back to the
          default globe.

          favicon.ico comes first because it is what a browser reaches for
          when it is told nothing at all, and it is the only declaration that
          covers a client too old to read PNG frames.
        */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/favicon-256.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/*
          The entrance and reveal utilities (.rise, .settle, .reveal) all start
          at opacity:0 and are switched on by JavaScript. Without scripting
          nothing would ever reveal them, so force every one visible up front.
        */}
        <noscript>
          <style>{`
            .rise, .settle, .reveal, .modal-in {
              opacity: 1 !important;
              transform: none !important;
              animation: none !important;
            }
          `}</style>
        </noscript>
        <ThemeProvider>
          {/* Whether a member of staff is signed in, so the bar can show
              them the staff links rather than the student's. */}
          <StaffSessionProvider>
            {/* The bell, the settings and the class timers. One provider,
                because the bar, the panel and the timers must not disagree
                about how much is unread. */}
            <NotificationProvider>
              {/* Where the breaks inside a lecture fall. One provider, so
                  the countdown and the timetable cannot disagree about
                  them. */}
              <ScheduleProvider breaks={breaks}>
                <Nav />
                {/* The light and dark switch. It floats below the bar on
                    every screen, because it is put in the page's own top
                    padding, and the top of a page is the one place on it
                    that is always empty. The bar keeps its room for the
                    links, the clock and the bell. */}
                <ThemePill />
                {/* The countdown floats below the bar on a phone, like the
                    switch, so the bar keeps its room for the links. On a
                    desktop it stays in the bar where there is room. */}
                <CountdownPill />
                {/* pb keeps the last element of any page clear of the footer.
                    Without it, whichever page forgets its own bottom padding
                    sits flush against the footer's top border. */}
                <main className="flex-1 pb-16">{children}</main>
                <Footer />
              </ScheduleProvider>
            </NotificationProvider>
          </StaffSessionProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
