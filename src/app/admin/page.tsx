import Link from "next/link";
import { dbGet } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import AdminShell from "@/components/AdminShell";
import ApplicationsManager from "@/components/ApplicationsManager";
import WaLinkSettings from "@/components/WaLinkSettings";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const counts = await Promise.all([
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members"),
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members WHERE active = 1"),
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM applications WHERE status = 'pending'"),
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM announcements"),
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM events"),
    dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM push_subscriptions"),
  ]);
  const [totalMembers, activeMembers, pendingApps, totalNews, totalEvents, pushSubs] =
    counts.map((r) => r?.c ?? 0);

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-black sm:text-4xl">{tr("admin.dashboard.title")}</h1>
        <p className="mt-2 text-zinc-400">{tr("admin.dashboard.subtitle")}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label={tr("admin.dashboard.totalMembers")} value={totalMembers} />
          <StatCard label={tr("admin.dashboard.activeMembers")} value={activeMembers} />
          <StatCard label={tr("admin.dashboard.pendingApps")} value={pendingApps} />
          <StatCard label={tr("admin.dashboard.news")} value={totalNews} />
          <StatCard label={tr("admin.dashboard.schedule")} value={totalEvents} />
          <StatCard label={tr("admin.dashboard.pushSubs")} value={pushSubs} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/member"
            className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
          >
            {tr("admin.dashboard.manageMembers")}
          </Link>
          <Link
            href="/admin/berita"
            className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            {tr("admin.dashboard.manageNews")}
          </Link>
          <Link
            href="/admin/jadwal"
            className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            {tr("admin.dashboard.manageSchedule")}
          </Link>
        </div>

        <WaLinkSettings lang={lang} />

        <h2 className="mt-10 text-xl font-bold">{tr("admin.dashboard.applications")}</h2>
        <p className="mt-1 text-sm text-zinc-400">{tr("admin.dashboard.applicationsDesc")}</p>
        <div className="mt-4">
          <ApplicationsManager lang={lang} />
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
      <p className="text-3xl font-black text-emerald-400">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{label}</p>
    </div>
  );
}
