import { NextResponse } from "next/server";
import {
  addSubscription,
  getPrefs,
  publicVapidKey,
  setPrefs,
  type NotificationKind,
} from "@/lib/notifications";

/**
 * The push subscription and the preferences that go with it.
 *
 * A device posts its subscription here once, and its preferences whenever
 * they change. Nothing about a person is stored: a subscription is a device,
 * and the preferences are the kinds and the courses that device asked for.
 */

function deviceId(request: Request): string | null {
  const id = request.headers.get("x-device-id");
  return id && id.length >= 8 && id.length <= 64 ? id : null;
}

export async function GET(request: Request) {
  const device = deviceId(request);
  if (!device) {
    return NextResponse.json({ error: "no device" }, { status: 400 });
  }

  return NextResponse.json({
    prefs: await getPrefs(device),
    publicKey: publicVapidKey(),
  });
}

export async function POST(request: Request) {
  const device = deviceId(request);
  if (!device) {
    return NextResponse.json({ error: "no device" }, { status: 400 });
  }

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    prefs?: {
      kinds?: NotificationKind[];
      courses?: string[];
      quietFrom?: string;
      quietTo?: string;
      tz?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // Preferences on their own.
  if (body.prefs) {
    const prefs = await setPrefs(device, body.prefs);
    return NextResponse.json({ prefs });
  }

  // A new subscription.
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  await addSubscription({
    deviceId: device,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true, publicKey: publicVapidKey() });
}

export async function DELETE(request: Request) {
  const device = deviceId(request);
  if (!device) {
    return NextResponse.json({ error: "no device" }, { status: 400 });
  }

  const { removeSubscription } = await import("@/lib/notifications");
  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  if (body.endpoint) await removeSubscription(body.endpoint);

  return NextResponse.json({ ok: true });
}
