import { dbAll } from "@/lib/db";
import type { Announcement } from "@/lib/types";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import Reveal from "@/components/Reveal";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Berita",
  description: "Berita dan pengumuman terbaru dari aliansi APX.",
};

export default async function BeritaPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const announcements = await dbAll<Announcement>(
    "SELECT id, title, slug, content, created_at FROM announcements ORDER BY id DESC"
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("news.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("news.subtitle")}</p>

      {announcements.length === 0 ? (
        <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
          {tr("news.empty")}
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {announcements.map((a, i) => (
            <Reveal key={a.id} delay={i * 80}>
              <article className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h2 className="text-lg font-bold text-zinc-100">
                  {a.slug ? (
                    <Link
                      href={`/berita/${a.slug}`}
                      className="transition-colors hover:text-emerald-400"
                    >
                      {a.title}
                    </Link>
                  ) : (
                    a.title
                  )}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">{a.created_at}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">{a.content}</p>
                {a.slug && (
                  <Link
                    href={`/berita/${a.slug}`}
                    className="mt-3 inline-block text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    {tr("news.readMore")}
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
