"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type CheckIn = {
  id: number;
  name: string;
  discord: string | null;
  created_at: string;
};

export default function CheckInSection({
  eventId,
  lang,
}: {
  eventId: number;
  lang: Lang;
}) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const tsRef = useRef(0);

  async function load() {
    const res = await fetch(`/api/events/${eventId}/checkins`);
    const json = await res.json();
    if (json.ok) setCheckins(json.checkins);
    setLoading(false);
  }

  useEffect(() => {
    tsRef.current = Date.now();
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/events/${eventId}/checkins`);
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setCheckins(json.checkins);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          discord: data.get("discord"),
          ts: tsRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? tr("event.checkin.error"));
      }
      setStatus("success");
      form.reset();
      await load();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : tr("event.checkin.error"));
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-700/70 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 hover:border-zinc-600/70 focus:border-emerald-400/80 focus:bg-zinc-950 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <section className="card-lift mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
      <h2 className="text-xl font-black">
        ⚔️ {tr("event.checkin.title")}
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {tr("event.checkin.count", { count: checkins.length })}
        </span>
      </h2>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-400">{tr("common.loading")}</p>
        ) : checkins.length === 0 ? (
          <p className="text-sm text-zinc-500">{tr("event.checkin.empty")}</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950/60">
            {checkins.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="text-sm font-semibold text-zinc-100">{c.name}</span>
                <span className="text-xs text-zinc-500">{c.discord ?? ""}</span>
              </li>
            ))}
          </ul>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("event.checkin.name")}
            </span>
            <input className={inputCls} name="name" required placeholder={tr("event.checkin.namePh")} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("event.checkin.discord")}
            </span>
            <input
              className={inputCls}
              name="discord"
              placeholder={tr("event.checkin.discordPh")}
            />
          </label>
        </div>

        {status === "success" && (
          <p className="text-sm text-emerald-400">{tr("event.checkin.done")}</p>
        )}
        {status === "error" && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {status === "loading" ? tr("event.checkin.sending") : tr("event.checkin.submit")}
        </button>
      </form>
    </section>
  );
}
