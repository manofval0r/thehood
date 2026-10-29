import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import {
  getOutlookConnectionHealth,
  syncManagedOutlook,
} from "@/lib/outlook-calendar";

function schedulerAuthorized(request: Request): boolean {
  const expected = process.env.PUSH_SCHEDULE_SECRET;
  return Boolean(
    expected && request.headers.get("x-push-secret") === expected
  );
}

export async function POST(request: Request) {
  const staff = await currentStaff();
  if (!schedulerAuthorized(request) && (!staff || !isSuper(staff))) {
    return Response.json({ error: "Not permitted." }, { status: 403 });
  }

  try {
    const result = await syncManagedOutlook();
    return Response.json({
      ok: true,
      ...result,
      health: await getOutlookConnectionHealth(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Outlook sync failed.",
        health: await getOutlookConnectionHealth(),
      },
      { status: 502 }
    );
  }
}
