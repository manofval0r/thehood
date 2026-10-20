import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://thehood.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The staff area holds personal data and is behind the shared code.
        // It has no business in an index.
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
