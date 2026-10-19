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
  title: "Cyber-Security 300L · Course Resources",
  description:
    "Course resources for the Cyber-Security 300 Level programme, First Semester 2026/2027, Nigerian University of Technology and Management.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
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
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
