import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ThemeProvider, THEME_BOOTSTRAP } from "@/components/ThemeProvider";
import { StaffSessionProvider } from "@/components/StaffSession";
import { NotificationProvider } from "@/components/NotificationProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cybersecurity 300L · Course Resources",
  description:
    "Course resources for the Cybersecurity 300 Level programme, First Semester 2026/2027, Nigerian University of Technology and Management.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Matches the provider's server-side default so the first client render
      // never disagrees with the markup it hydrated.
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
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
              <Nav />
              {/* pb keeps the last element of any page clear of the footer. Without
                  it, whichever page forgets its own bottom padding sits flush against
                  the footer's top border. */}
              <main className="flex-1 pb-16">{children}</main>
              <Footer />
            </NotificationProvider>
          </StaffSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
