import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-clip">
        <link rel="icon" href="/favicon.png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
        <Nav />
        {/* pb keeps the last element of any page clear of the footer. Without
            it, whichever page forgets its own bottom padding sits flush against
            the footer's top border. */}
        <main className="flex-1 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
