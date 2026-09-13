import type { Metadata } from "next";
import EventManager from "@/components/EventManager";
import AdminShell from "@/components/AdminShell";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, "admin.schedule.title"), robots: { index: false, follow: false } };
}

export default async function AdminJadwalPage() {
  const lang = await getLang();
  return (
    <AdminShell>
      <EventManager lang={lang} />
    </AdminShell>
  );
}
