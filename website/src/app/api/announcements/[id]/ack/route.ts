import { NextResponse } from "next/server";
import { acknowledge, getAnnouncement } from "@/lib/announcements";

/**
 * Say that this device has seen an announcement.
 *
 * A cancellation is worth knowing people have seen, so a message can ask
 * for a confirmation. This is where the confirmation goes.
 *
 * The device is the only thing that can be put a name to, because the
 * students have no accounts, so this records a device and not a person, and
 * the count that comes out of it is labelled as devices wherever it is
 * shown.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const device = request.headers.get("x-device-id");
  if (!device || device.length < 8 || device.length > 64) {
    return NextResponse.json({ error: "no device" }, { status: 400 });
  }

  const announcement = await getAnnouncement(id);
  if (!announcement) {
    return NextResponse.json({ error: "no such message" }, { status: 404 });
  }
  if (!announcement.needs_ack) {
    return NextResponse.json({ ok: true, already: true });
  }

  await acknowledge(id, device);

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
