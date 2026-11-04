import { NextResponse, type NextRequest } from "next/server";

/**
 * Pages this site has switched off, for real.
 *
 * A super admin can turn a public or staff route off. The navigation stops
 * naming it, and this proxy answers a direct visit to the address with a
 * redirect. It reads the same two lists the toggles write, cached
 * in-memory for a few minutes so it costs at most one fetch per burst of
 * requests.
 */

const KEY_PUBLIC = "pages_off_public";
const KEY_ADMIN = "pages_off_admin";
const TTL = 5 * 60 * 1000;

let cache: { at: number; public: string[]; admin: string[] } | null = null;

async function fetchDisabled(): Promise<{ public: string[]; admin: string[] }> {
  if (cache && Date.now() - cache.at < TTL) return cache;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { public: [], admin: [] };

  const load = async (k: string): Promise<string[]> => {
    try {
      const res = await fetch(
        `${url}/rest/v1/app_config?key=eq.${encodeURIComponent(k)}&select=value`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as { value: string }[];
      const raw = rows?.[0]?.value;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [pub, adm] = await Promise.all([load(KEY_PUBLIC), load(KEY_ADMIN)]);
  cache = { at: Date.now(), public: pub, admin: adm };
  return cache;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const disabled = await fetchDisabled();

  if (pathname.startsWith("/admin")) {
    const off = new Set(disabled.admin);
    if (off.has(pathname)) {
      return NextResponse.redirect(new URL("/admin/settings", request.url));
    }
    return NextResponse.next();
  }

  const off = new Set(disabled.public);
  if (off.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Static assets, images and the framework's own files never reach this.
   * API routes are excluded because a redirect to HTML is never the right
   * answer to an XHR. Everything else is checked.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|pdf.worker.min.mjs).*)"],
};
