import { NextResponse } from "next/server";
import { announceClasses } from "@/lib/push";
import { getCtfEvents } from "@/lib/events";
import { recordHealth } from "@/lib/push";

/**
 * The scheduler.
 *
 * The only notifications that need a clock are the class reminders, and this
 * is where the clock is. It is called by whatever is running the schedule:
 * a Vercel cron, or Supabase's own cron calling this over the network with
 * the shared secret.
 *
 * Everything else in the notification system is event-driven. A file was
 * uploaded, so the upload says so. There is nothing here about files.
 */
async function run(request: Request) {
  const secret = request.headers.get("x-push-secret");
  const expected = process.env.PUSH_SCHEDULE_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const result = await announceClasses();

  // The competitions feed is the one thing that can break without anybody
  // noticing, so the scheduler checks it and writes down what it found.
  try {
    const events = await getCtfEvents(1);
    await recordHealth(
      "news",
      events.length > 0,
      events.length > 0 ? undefined : "no events"
    );
  } catch (error) {
    await recordHealth(
      "news",
      false,
      error instanceof Error ? error.message.slice(0, 200) : "unknown"
    );
  }

  return NextResponse.json({ ok: true, ...result });
}

/**
 * Both verbs, because the callers disagree.
 *
 * A Vercel cron sends a GET. The database's own cron sends a POST, because
 * that is what the HTTP client it has does. The route used to answer only
 * the GET, so the one caller that mattered most was answered with a 405
 * and the reminders never went out.
 */
export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
