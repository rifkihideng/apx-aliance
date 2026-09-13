import type { Metadata } from "next";
import MemberManager from "@/components/MemberManager";
import AdminShell from "@/components/AdminShell";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.member.title"), robots: { index: false, follow: false } };
}

export default async function AdminMemberPage() {
  const lang = await getLang();
  return (
    <AdminShell>
      <MemberManager lang={lang} />
    </AdminShell>
  );
}
