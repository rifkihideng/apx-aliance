"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type Comment = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

export default function CommentSection({
  announcementId,
  lang,
}: {
  announcementId: number;
  lang: Lang;
}) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  const tsRef = useRef(0);

  useEffect(() => {
    tsRef.current = Date.now();
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/announcements/${announcementId}/comments`);
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setComments(json.comments);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [announcementId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          message: data.get("message"),
          ts: tsRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? tr("news.comments.error"));
      }
      setStatus("success");
      setPending(json.pending === true);
      form.reset();
      if (json.pending !== true) {
        const fresh = await fetch(`/api/announcements/${announcementId}/comments`);
        const freshJson = await fresh.json();
        if (freshJson.ok) setComments(freshJson.comments);
        setLoading(false);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : tr("news.comments.error"));
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-700/70 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 hover:border-zinc-600/70 focus:border-emerald-400/80 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <section className="card-lift mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
      <h2 className="text-xl font-black">
        {tr("news.comments.title")}
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {tr("news.comments.count", { count: comments.length })}
        </span>
      </h2>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-zinc-400">{tr("common.loading")}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-zinc-500">{tr("news.comments.empty")}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-emerald-300">{c.name}</p>
                <p className="text-xs text-zinc-600">{c.created_at}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {c.message}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {/* Honeypot anti-spam: tidak terlihat oleh manusia, hanya diisi bot. */}
        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label>
            Jangan diisi
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-300">
            {tr("news.comments.name")}
          </span>
          <input className={inputCls} name="name" required placeholder={tr("news.comments.namePh")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-300">
            {tr("news.comments.message")}
          </span>
          <textarea
            className={inputCls}
            name="message"
            rows={3}
            required
            placeholder={tr("news.comments.messagePh")}
          />
        </label>

        {status === "success" && (
          <p className="text-sm text-emerald-400">
            {pending ? tr("news.comments.sent") : tr("news.comments.posted")}
          </p>
        )}
        {status === "error" && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {status === "loading" ? tr("news.comments.sending") : tr("news.comments.submit")}
        </button>

        <p className="text-xs text-zinc-600">{tr("news.comments.modNote")}</p>
      </form>
    </section>
  );
}
