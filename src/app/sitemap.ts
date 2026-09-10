import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const routes = ["", "/roster", "/rekrut", "/berita", "/jadwal", "/aturan", "/faq"];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
  }));
}
