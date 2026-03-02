import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://limssong.github.io/blackwhite";
const BASE_PATH = process.env.NODE_ENV === "production" ? "/blackwhite" : "";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${BASE_PATH}`;
  return [
    {
      url: base.endsWith("/") ? base : `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
