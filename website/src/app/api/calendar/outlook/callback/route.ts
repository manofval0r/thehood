import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/admin-session";
import { isSuper } from "@/lib/staff";
import {
  exchangeOutlookCode,
  storeOutlookConnection,
  syncManagedOutlook,
} from "@/lib/outlook-calendar";
import { readOutlookState } from "@/lib/outlook-calendar-core";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (params: Record<string, string>) => {
    const target = new URL("/admin/bulletin", url.origin);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target);
  };

  const staff = await currentStaff();
  if (!staff || !isSuper(staff)) return back({ calendarError: "forbidden" });

  const code = url.searchParams.get("code");
  const stateValue = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const secret = process.env.ADMIN_SECRET;
  const state =
    stateValue && secret ? readOutlookState(stateValue, secret) : null;
  if (
    error ||
    !code ||
    !state ||
    state.staffId !== staff.id
  ) {
    return back({ calendarError: error || "invalid_state" });
  }

  try {
    const token = await exchangeOutlookCode({
      code,
      redirectUri: `${url.origin}/api/calendar/outlook/callback`,
    });
    await storeOutlookConnection({
      token,
      staff: { id: staff.id, name: staff.name },
    });
    await syncManagedOutlook();
    return back({ calendarConnected: "outlook" });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "connection_failed";
    return back({ calendarError: message.slice(0, 80) });
  }
}
