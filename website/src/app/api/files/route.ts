import { NextResponse } from "next/server";
import { getAllFiles } from "@/lib/files";

/**
 * The file index.
 *
 * This is the endpoint the manifest used to be. It serves the whole index in
 * one request: what file belongs to which course, what it is called and
 * where it is served from.
 *
 * The search uses it, because a file that staff uploaded has to be findable
 * by name, and the search runs in the browser where the manifest used to
 * live. The response is cached and tagged, so an upload reaches it on the
 * next request rather than after the cache ages out.
 */
export async function GET() {
  const files = await getAllFiles();

  return NextResponse.json(
    files.map((f) => ({
      id: f.id,
      course: f.course,
      title: f.title,
      type: f.type,
      url: f.url,
      size: f.size,
      source: f.source,
    })),
    {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
