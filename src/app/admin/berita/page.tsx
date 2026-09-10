import type { Metadata } from "next";
import AnnouncementManager from "@/components/AnnouncementManager";
import AdminShell from "@/components/AdminShell";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.news.title") };
}

export default async function AdminBeritaPage() {
  const lang = await getLang();
  return (
    <AdminShell>
      <AnnouncementManager lang={lang} />
    </AdminShell>
  );
}
