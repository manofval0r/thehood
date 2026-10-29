import { Suspense } from "react";
import { connection } from "next/server";
import BulletinBoard3D from "@/components/BulletinBoard3D";
import { getBulletinFeed } from "@/lib/bulletin";
import { currentStudent } from "@/lib/student-session";

export const metadata = {
  title: "Campus bulletin · Cybersecurity 300L — Interactive cork board",
  description: "Interactive bulletin board with sticky notes, events, classes, deadlines, and alerts.",
};

export default function BulletinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 md:pt-20 lg:px-8">
      <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-2xl border border-border bg-surface" />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Board({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const archive = params.view === "archive";
  const student = await currentStudent();
  const feed = await getBulletinFeed({ archive, student });
  return <BulletinBoard3D feed={feed} fullPage />;
}
