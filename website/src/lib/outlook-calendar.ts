import "server-only";

import { rest } from "@/lib/rest";
import {
  decryptOutlookToken,
  encryptOutlookToken,
  normalizeGraphEvent,
  type GraphCalendarEvent,
} from "@/lib/outlook-calendar-core";
import type { OutlookEvent } from "@/lib/bulletin-types";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

interface ConnectionRow {
  provider: "outlook";
  refresh_token_cipher: string;
  access_token_cipher: string | null;
  access_token_expires_at: string | null;
  account_email: string | null;
  scopes: string[];
  connected_by: string;
  connected_by_name: string;
  connected_at: string;
  synced_at: string | null;
  sync_status: "pending" | "ok" | "error";
  last_error: string | null;
  updated_at: string;
}

function adminSecret(): string {
  const value = process.env.ADMIN_SECRET;
  if (!value) throw new Error("ADMIN_SECRET is not configured.");
  return value;
}

function oauthConfig() {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function outlookIsConfigured(): boolean {
  return oauthConfig() !== null;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Microsoft token exchange returned ${response.status}.`);
  }
  return (await response.json()) as TokenResponse;
}

export async function exchangeOutlookCode(args: {
  code: string;
  redirectUri: string;
}) {
  const config = oauthConfig();
  if (!config) throw new Error("Outlook OAuth is not configured.");
  return tokenRequest(
    new URLSearchParams({
      code: args.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: args.redirectUri,
      grant_type: "authorization_code",
      scope: "Calendars.Read offline_access User.Read",
    })
  );
}

async function graphProfile(accessToken: string) {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!response.ok) return null;
  return (await response.json()) as {
    mail?: string;
    userPrincipalName?: string;
  };
}

export async function storeOutlookConnection(args: {
  token: TokenResponse;
  staff: { id: string; name: string };
}): Promise<void> {
  if (!args.token.refresh_token) {
    throw new Error("Microsoft did not return an offline refresh token.");
  }
  const profile = await graphProfile(args.token.access_token);
  const expiresAt = new Date(
    Date.now() + Math.max(60, args.token.expires_in - 60) * 1000
  ).toISOString();
  await rest("calendar_connections?on_conflict=provider", {
    method: "POST",
    body: {
      provider: "outlook",
      refresh_token_cipher: encryptOutlookToken(
        args.token.refresh_token,
        adminSecret()
      ),
      access_token_cipher: encryptOutlookToken(
        args.token.access_token,
        adminSecret()
      ),
      access_token_expires_at: expiresAt,
      account_email: profile?.mail ?? profile?.userPrincipalName ?? null,
      scopes: args.token.scope?.split(/\s+/).filter(Boolean) ?? [],
      connected_by: args.staff.id,
      connected_by_name: args.staff.name,
      connected_at: new Date().toISOString(),
      sync_status: "pending",
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function connection(): Promise<ConnectionRow | null> {
  const rows = await rest<ConnectionRow[]>(
    "calendar_connections?provider=eq.outlook&select=*&limit=1"
  );
  return rows?.[0] ?? null;
}

async function accessToken(row: ConnectionRow): Promise<string> {
  const secret = adminSecret();
  const stillValid =
    row.access_token_cipher &&
    row.access_token_expires_at &&
    Date.parse(row.access_token_expires_at) > Date.now() + 60_000;
  if (stillValid) {
    const token = decryptOutlookToken(row.access_token_cipher as string, secret);
    if (token) return token;
  }

  const refresh = decryptOutlookToken(row.refresh_token_cipher, secret);
  const config = oauthConfig();
  if (!refresh || !config) throw new Error("The Outlook connection must be renewed.");
  const token = await tokenRequest(
    new URLSearchParams({
      refresh_token: refresh,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      scope: "Calendars.Read offline_access User.Read",
    })
  );
  await rest("calendar_connections?provider=eq.outlook", {
    method: "PATCH",
    body: {
      access_token_cipher: encryptOutlookToken(token.access_token, secret),
      refresh_token_cipher: token.refresh_token
        ? encryptOutlookToken(token.refresh_token, secret)
        : row.refresh_token_cipher,
      access_token_expires_at: new Date(
        Date.now() + Math.max(60, token.expires_in - 60) * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
  return token.access_token;
}

async function graphEvents(
  token: string,
  from: string,
  to: string
): Promise<GraphCalendarEvent[]> {
  const params = new URLSearchParams({
    startDateTime: from,
    endDateTime: to,
    "$select":
      "id,subject,bodyPreview,body,start,end,location,onlineMeeting,onlineMeetingUrl,webLink,isCancelled,lastModifiedDateTime",
    "$top": "200",
  });
  let next: string | null = `https://graph.microsoft.com/v1.0/me/calendarView?${params}`;
  const events: GraphCalendarEvent[] = [];
  while (next) {
    const response = await fetch(next, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'outlook.timezone="UTC"',
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Microsoft Graph returned ${response.status}.`);
    }
    const page = (await response.json()) as {
      value?: GraphCalendarEvent[];
      "@odata.nextLink"?: string;
    };
    events.push(...(page.value ?? []));
    next = page["@odata.nextLink"] ?? null;
  }
  return events;
}

export async function syncManagedOutlook(options: {
  now?: Date;
  daysBack?: number;
  daysAhead?: number;
} = {}): Promise<{ synced: number; skipped: number }> {
  if (!outlookIsConfigured()) return { synced: 0, skipped: 0 };
  let row: ConnectionRow | null = null;
  try {
    row = await connection();
  } catch {
    return { synced: 0, skipped: 0 };
  }
  if (!row) return { synced: 0, skipped: 0 };

  const now = options.now ?? new Date();
  const from = new Date(
    now.getTime() - (options.daysBack ?? 14) * 86400000
  ).toISOString();
  const to = new Date(
    now.getTime() + (options.daysAhead ?? 60) * 86400000
  ).toISOString();

  try {
    const token = await accessToken(row);
    const raw = await graphEvents(token, from, to);
    const events = raw
      .map(normalizeGraphEvent)
      .filter((event): event is OutlookEvent => Boolean(event));
    if (events.length > 0) {
      await rest("outlook_events?on_conflict=external_id", {
        method: "POST",
        body: events.map((event) => ({
          id: event.id,
          external_id: event.externalId,
          subject: event.subject,
          body_preview: event.bodyPreview,
          course: event.course,
          starts_at: event.startsAt,
          ends_at: event.endsAt,
          location: event.location,
          join_url: event.joinUrl,
          web_url: event.webUrl,
          is_cancelled: event.isCancelled,
          source_updated_at: event.sourceUpdatedAt,
          synced_at: new Date().toISOString(),
        })),
        prefer: "resolution=merge-duplicates,return=minimal",
      });
    }
    await rest("calendar_connections?provider=eq.outlook", {
      method: "PATCH",
      body: {
        synced_at: new Date().toISOString(),
        sync_status: "ok",
        last_error: null,
        updated_at: new Date().toISOString(),
      },
    });
    return { synced: events.length, skipped: raw.length - events.length };
  } catch (error) {
    await rest("calendar_connections?provider=eq.outlook", {
      method: "PATCH",
      body: {
        sync_status: "error",
        last_error:
          error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
        updated_at: new Date().toISOString(),
      },
    }).catch(() => undefined);
    throw error;
  }
}

export async function getOutlookConnectionHealth() {
  if (!outlookIsConfigured()) {
    return {
      configured: false,
      connected: false,
      accountEmail: null,
      status: "not_configured" as const,
      syncedAt: null,
      lastError: null,
    };
  }
  try {
    const row = await connection();
    return {
      configured: true,
      connected: Boolean(row),
      accountEmail: row?.account_email ?? null,
      status: row?.sync_status ?? ("pending" as const),
      syncedAt: row?.synced_at ?? null,
      lastError: row?.last_error ?? null,
    };
  } catch {
    return {
      configured: true,
      connected: false,
      accountEmail: null,
      status: "error" as const,
      syncedAt: null,
      lastError: "Calendar storage is not available.",
    };
  }
}
