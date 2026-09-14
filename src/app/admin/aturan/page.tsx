import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";
import ContentManager from "@/components/ContentManager";
import { getLang } from "@/lib/lang";
import { requireAdmin } from "@/lib/admin-server";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.content.rulesTitle"), robots: { index: false, follow: false } };
}

export default async function AdminAturanPage() {
  await requireAdmin();
  const lang = await getLang();
  return (
    <AdminShell>
      <ContentManager section="rules" lang={lang} />
    </AdminShell>
  );
}
