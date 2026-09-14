import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { dbAll } from "@/lib/db";

// Sitemap dibuat dinamis agar berita/jadwal baru langsung terindeks
// tanpa perlu menunggu build ulang.
export const dynamic = "force-dynamic";

function toDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const routes = ["", "/roster", "/rekrut", "/berita", "/jadwal", "/aturan", "/faq"];

  const entries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
  }));

  // Halaman dinamis berita & jadwal (slug dibaca dari database).
  try {
    const [posts, events] = await Promise.all([
      dbAll<{ slug: string | null; updated_at: string | null; created_at: string }>(
        "SELECT slug, updated_at, created_at FROM announcements WHERE slug IS NOT NULL AND slug != ''"
      ),
      dbAll<{ slug: string | null; updated_at: string | null; created_at: string }>(
        "SELECT slug, updated_at, created_at FROM events WHERE slug IS NOT NULL AND slug != ''"
      ),
    ]);

    for (const post of posts) {
      if (!post.slug) continue;
      entries.push({
        url: `${base}/berita/${post.slug}`,
        lastModified: toDate(post.updated_at ?? post.created_at),
      });
    }

    for (const event of events) {
      if (!event.slug) continue;
      entries.push({
        url: `${base}/jadwal/${event.slug}`,
        lastModified: toDate(event.updated_at ?? event.created_at),
      });
    }
  } catch (error) {
    console.warn("[sitemap] Tidak bisa membaca berita/jadwal dari database:", error);
  }

  return entries;
}
