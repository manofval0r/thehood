import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // Uploads ride Server Actions (multipart form data). The framework
      // default is 1mb, which rejected anything larger before the app's own
      // 25mb check in uploadCourseFile could run, surfacing as Next's generic
      // "An unexpected response was received from the server." 26mb leaves
      // headroom above the app limit for multipart boundary overhead.
      bodySizeLimit: "26mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
