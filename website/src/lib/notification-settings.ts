import "server-only";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { rest } from "@/lib/rest";
import { KINDS, type NotificationKind } from "@/lib/notification-kinds";

/**
 * What the site sends at all.
 *
 * A reader chooses what they want to be told about, in the bell. This is
 * the other half: what the site is allowed to tell anybody. It is for the
 * case where a kind is wrong for a while, because the timetable changed or
 * the calendar is being rebuilt, and turning it off for everybody is
 * better than turning it off for a hundred people one at a time.
 *
 * The kinds that are on are not written down. Only the ones that are off
 * are, so a kind that is added to the code later starts on, which is the
 * right way round: a new kind nobody has looked at yet should not be
 * switched off by an old setting.
 *
 * A message a super admin sends by hand is not affected. The point of
 * those is that they are not a kind anybody can mute.
 */

const KEY = "notification_kinds_off";

/** The kinds that are switched off, for everybody. */
export async function getDisabledKinds(): Promise<NotificationKind[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("notification-settings");

  try {
    const rows = await rest<{ value: string }[]>(
      `app_config?key=eq.${encodeURIComponent(KEY)}&select=value`
    );
    const raw = rows?.[0]?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter((k): k is NotificationKind =>
      (KINDS as string[]).includes(k)
    );
  } catch {
    // A settings row that cannot be read is a settings row that is not
    // there, which means nothing is switched off.
    return [];
  }
}

/** Whether a kind is sent at all. */
export async function kindIsEnabled(
  kind: NotificationKind
): Promise<boolean> {
  const disabled = await getDisabledKinds();
  return !disabled.includes(kind);
}

/** Turn a kind on or off, for everybody. */
export async function setKindEnabled(
  kind: NotificationKind,
  enabled: boolean
): Promise<void> {
  const disabled = new Set(await getDisabledKinds());

  if (enabled) disabled.delete(kind);
  else disabled.add(kind);

  await rest("app_config?on_conflict=key", {
    method: "POST",
    body: {
      key: KEY,
      value: JSON.stringify([...disabled]),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  updateTag("notification-settings");
}
