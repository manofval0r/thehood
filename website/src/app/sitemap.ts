import type { MetadataRoute } from "next";
import { COURSES } from "@/lib/resources";

/** Canonical origin. Override with NEXT_PUBLIC_SITE_URL on the deployment. */
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://thehood.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, priority: 1, changeFrequency: "weekly" },
    { url: `${BASE}/timetable`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/timeline`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/registration`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
  ];

  const courseRoutes: MetadataRoute.Sitemap = COURSES.map((c) => ({
    url: `${BASE}/courses/${c.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  return [...staticRoutes, ...courseRoutes];
}
