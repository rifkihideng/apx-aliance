import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";
import ContentManager from "@/components/ContentManager";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.content.faqTitle"), robots: { index: false, follow: false } };
}

export default async function AdminFaqPage() {
  const lang = await getLang();
  return (
    <AdminShell>
      <ContentManager section="faq" lang={lang} />
    </AdminShell>
  );
}
