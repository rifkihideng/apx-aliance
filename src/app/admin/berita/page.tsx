import type { Metadata } from "next";
import AnnouncementManager from "@/components/AnnouncementManager";
import CommentManager from "@/components/CommentManager";
import AdminShell from "@/components/AdminShell";
import { getLang } from "@/lib/lang";
import { requireAdmin } from "@/lib/admin-server";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.news.title"), robots: { index: false, follow: false } };
}

export default async function AdminBeritaPage() {
  await requireAdmin();
  const lang = await getLang();
  return (
    <AdminShell>
      <AnnouncementManager lang={lang} />
      <CommentManager lang={lang} />
    </AdminShell>
  );
}
