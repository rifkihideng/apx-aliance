"use client";

import { useEffect, useState } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type AdminComment = {
  id: number;
  announcement_id: number;
  announcement_title: string | null;
  name: string;
  message: string;
  approved: number;
  created_at: string;
};

export default function CommentManager({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(lang, key);

  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/comments");
    const json = await res.json();
    if (json.ok) setItems(json.comments);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/comments");
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setItems(json.comments);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(id: number) {
    setMessage("");
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.comments.fail"));
      setMessage(tr("admin.comments.approvedMsg"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.comments.fail"));
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm(tr("admin.comments.confirmDelete"))) return;
    setMessage("");
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.comments.fail"));
      setMessage(tr("admin.comments.deletedMsg"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.comments.fail"));
    }
  }

  return (
    <div className="mx-auto max-w-4xl border-t border-zinc-800 px-4 pb-16 pt-10 sm:px-6">
      <h2 className="text-2xl font-black">{tr("admin.comments.title")}</h2>
      <p className="mt-1 text-zinc-400">{tr("admin.comments.subtitle")}</p>

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

      <div className="mt-6">
        {loading ? (
          <p className="text-zinc-400">{tr("admin.comments.loading")}</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
            {tr("admin.comments.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-100">{c.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.approved
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {c.approved ? tr("admin.comments.approved") : tr("admin.comments.pending")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {c.announcement_title ?? "—"} · {c.created_at}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {c.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!c.approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(c.id)}
                        className="rounded-md border border-emerald-700 px-3 py-1 text-xs text-emerald-300 hover:border-emerald-400"
                      >
                        {tr("admin.comments.approve")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                    >
                      {tr("admin.comments.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
