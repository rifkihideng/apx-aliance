"use client";

import { useEffect, useState } from "react";
import type { Application } from "@/lib/types";
import { translate as t, type Lang } from "@/i18n/dictionaries";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  diterima: "bg-emerald-500/20 text-emerald-300",
  ditolak: "bg-red-500/20 text-red-300",
};

export default function ApplicationsManager({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(lang, key);
  const statusLabel = (s: string) => {
    if (s === "diterima") return tr("admin.apps.status.accepted");
    if (s === "ditolak") return tr("admin.apps.status.rejected");
    return tr("admin.apps.status.pending");
  };
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/applications");
    const json = await res.json();
    if (json.ok) setItems(json.applications);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/applications");
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setItems(json.applications);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setStatus(id: number, status: "diterima" | "ditolak") {
    setBusyId(id);
    setMessage("");

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.apps.updateFail"));
      setMessage(status === "diterima" ? tr("admin.apps.accepted") : tr("admin.apps.rejected"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.apps.updateFail"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="mt-4 text-zinc-400">{tr("admin.apps.loading")}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
        {tr("admin.apps.empty")}
      </div>
    );
  }

  return (
    <div>
      {message && <p className="mb-3 text-sm text-emerald-400">{message}</p>}

      <div className="grid gap-4">
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-lg font-bold">{a.ign}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusColors[a.status] ?? "bg-zinc-700 text-zinc-300"
                }`}
              >
                {statusLabel(a.status)}
              </span>
            </div>

            <dl className="mt-4 space-y-1 text-sm text-zinc-400">
              <div className="flex justify-between gap-4">
                <dt>{tr("admin.apps.level")}</dt>
                <dd className="text-zinc-200">{a.level ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{tr("admin.apps.discord")}</dt>
                <dd className="text-zinc-200">{a.discord ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{tr("admin.apps.applied")}</dt>
                <dd className="text-zinc-200">{a.created_at}</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
              {a.alasan ?? "-"}
            </p>

            {a.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => setStatus(a.id, "diterima")}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
                >
                  {tr("admin.apps.accept")}
                </button>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => setStatus(a.id, "ditolak")}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-60"
                >
                  {tr("admin.apps.reject")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
