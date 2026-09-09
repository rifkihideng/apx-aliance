import Link from "next/link";
import { dbGet } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import ApplicationsManager from "@/components/ApplicationsManager";
import WaLinkSettings from "@/components/WaLinkSettings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const totalMembers = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members"))?.c ?? 0;
  const activeMembers = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members WHERE active = 1"))?.c ?? 0;
  const pendingApps = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM applications WHERE status = 'pending'"))?.c ?? 0;
  const totalNews = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM announcements"))?.c ?? 0;
  const totalEvents = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM events"))?.c ?? 0;
  const pushSubs = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM push_subscriptions"))?.c ?? 0;

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-black sm:text-4xl">Panel Admin</h1>
        <p className="mt-2 text-zinc-400">Ringkasan dan pengelolaan aliansi APX.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Member" value={totalMembers} />
          <StatCard label="Member Aktif" value={activeMembers} />
          <StatCard label="Pendaftar Pending" value={pendingApps} />
          <StatCard label="Berita" value={totalNews} />
          <StatCard label="Jadwal" value={totalEvents} />
          <StatCard label="Notifikasi Aktif" value={pushSubs} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/member"
            className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Kelola Member
          </Link>
          <Link
            href="/admin/berita"
            className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            Kelola Berita
          </Link>
          <Link
            href="/admin/jadwal"
            className="rounded-lg border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            Kelola Jadwal
          </Link>
        </div>

        <WaLinkSettings />

        <h2 className="mt-10 text-xl font-bold">Daftar Pendaftar</h2>
        <p className="mt-1 text-sm text-zinc-400">Terima atau tolak pendaftaran member.</p>
        <div className="mt-4">
          <ApplicationsManager />
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
