"use client";

import { useEffect, useState } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type AdminCheckIn = {
  id: number;
  event_id: number;
  event_title: string | null;
  name: string;
  discord: string | null;
  created_at: string;
};

export default function CheckInManager({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(lang, key);

  const [items, setItems] = useState<AdminCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/checkins");
    const json = await res.json();
    if (json.ok) setItems(json.checkins);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/checkins");
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setItems(json.checkins);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm(tr("admin.checkin.confirmDelete"))) return;
    setMessage("");
    try {
      const res = await fetch(`/api/checkins/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.checkin.fail"));
      setMessage(tr("admin.checkin.deleted"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.checkin.fail"));
    }
  }

  return (
    <div className="mx-auto max-w-4xl border-t border-zinc-800 px-4 pb-16 pt-10 sm:px-6">
      <h2 className="text-2xl font-black">{tr("admin.checkin.title")}</h2>
      <p className="mt-1 text-zinc-400">{tr("admin.checkin.subtitle")}</p>

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

      <div className="mt-6">
        {loading ? (
          <p className="text-zinc-400">{tr("admin.checkin.loading")}</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
            {tr("admin.checkin.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100">{c.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {c.event_title ?? "—"}
                    {c.discord ? ` · ${c.discord}` : ""} · {c.created_at}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="shrink-0 rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                >
                  {tr("admin.checkin.delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
