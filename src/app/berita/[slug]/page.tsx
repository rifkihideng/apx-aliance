import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { dbGet } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

type AnnouncementRow = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await dbGet<{ title: string }>(
    "SELECT title FROM announcements WHERE slug = ?",
    slug
  );
  return { title: post?.title ?? "Berita" };
}

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const post = await dbGet<AnnouncementRow>(
    "SELECT id, title, content, created_at FROM announcements WHERE slug = ?",
    slug
  );

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/berita"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
      >
        {tr("news.back")}
      </Link>

      <article className="card-lift mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <h1 className="text-3xl font-black sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-xs text-zinc-500">{post.created_at}</p>
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {post.content}
        </p>
      </article>
    </div>
  );
}
