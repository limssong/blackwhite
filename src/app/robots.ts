import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://limssong.github.io/blackwhite";
const BASE_PATH = process.env.NODE_ENV === "production" ? "/blackwhite" : "";

export default function robots(): MetadataRoute.Robots {
  const base = `${SITE_URL}${BASE_PATH}`;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [],
    },
    sitemap: `${base.endsWith("/") ? base : `${base}/`}sitemap.xml`,
  };
}
