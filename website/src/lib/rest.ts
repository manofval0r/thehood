import "server-only";

/**
 * The one way this site talks to the database.
 *
 * PostgREST for the tables, the Storage API for the objects, and the service
 * role key for both. The key is read from the environment here and goes
 * nowhere else: it is never returned to a client, and it never appears in a
 * client bundle.
 *
 * The three stores on this site (files, attendance, staff) all use this, so
 * there is one place that knows how the database is reached and one place to
 * change when that changes.
 */

export interface StoreConfig {
  url: string;
  key: string;
}

/** The service role credentials, or null when they are not set. */
export function storeConfig(): StoreConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** Whether the store is reachable at all. */
export function isConfigured(): boolean {
  return storeConfig() !== null;
}

function required(): StoreConfig {
  const config = storeConfig();
  if (!config) {
    throw new Error(
      "The store is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }
  return config;
}

export interface RestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  prefer?: string;
}

/** A request to PostgREST. */
export async function rest<T>(
  path: string,
  options: RestOptions = {}
): Promise<T> {
  const { url, key } = required();
  const { method = "GET", body, headers = {}, prefer } = options;

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    // The store is the live record. Never serve a stale copy of it.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `The store returned ${res.status}: ${text.slice(0, 300)}`
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** A request to the Storage API. */
export async function storage(
  path: string,
  options: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {}
): Promise<Response> {
  const { url, key } = required();
  const { method = "GET", body, headers = {} } = options;

  return fetch(`${url}/storage/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...headers,
    },
    body,
    cache: "no-store",
  });
}
