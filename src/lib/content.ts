import { dbAll } from "@/lib/db";
import { dictionaries, type Lang } from "@/i18n/dictionaries";
import type { ContentItem } from "@/lib/types";

export type ResolvedContent = { id: number; title: string; body: string };

/**
 * Ambil konten FAQ / aturan dari database (bisa diedit dari admin).
 * Jika tabel masih kosong (mis. sebelum seed berjalan), pakai isi bawaan
 * dari kamus i18n sebagai fallback.
 */
export async function getContent(
  section: "faq" | "rules",
  lang: Lang
): Promise<ResolvedContent[]> {
  const rows = await dbAll<ContentItem>(
    "SELECT id, section, position, title_id, title_en, body_id, body_en FROM site_content WHERE section = ? ORDER BY position ASC, id ASC",
    section
  );

  if (rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      title: lang === "en" && r.title_en ? r.title_en : r.title_id,
      body: lang === "en" && r.body_en ? r.body_en : r.body_id ?? "",
    }));
  }

  if (section === "faq") {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      title: dictionaries[lang][`faq.q${i + 1}`] ?? "",
      body: dictionaries[lang][`faq.a${i + 1}`] ?? "",
    }));
  }

  return Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: dictionaries[lang][`rules.${i + 1}.title`] ?? "",
    body: dictionaries[lang][`rules.${i + 1}.desc`] ?? "",
  }));
}
