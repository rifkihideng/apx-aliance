"use client";

import { useEffect, useState, type FormEvent } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

export default function WaLinkSettings({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(lang, key);

  const [waLink, setWaLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (!cancelled && json.ok) {
          setWaLink(json.settings.wa_group_link ?? "");
          setDiscordLink(json.settings.discord_link ?? "");
        }
      } catch {
        // abaikan error load, tetap tampilkan form kosong
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_group_link: waLink, discord_link: discordLink }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.wa.fail"));
      setMessage(tr("admin.wa.saved"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.wa.fail"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  return (
    <form
      onSubmit={save}
      className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <h2 className="text-lg font-semibold">{tr("admin.wa.title")}</h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.wa.label")}</span>
          <input
            type="url"
            className={inputCls}
            value={waLink}
            onChange={(e) => setWaLink(e.target.value)}
            placeholder={tr("admin.wa.placeholder")}
            disabled={loading}
          />
          <span className="mt-1 block text-xs text-zinc-500">{tr("admin.wa.desc")}</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.discord.label")}</span>
          <input
            type="url"
            className={inputCls}
            value={discordLink}
            onChange={(e) => setDiscordLink(e.target.value)}
            placeholder={tr("admin.discord.placeholder")}
            disabled={loading}
          />
          <span className="mt-1 block text-xs text-zinc-500">{tr("admin.discord.desc")}</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={saving || loading}
        className="mt-4 shrink-0 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {saving ? tr("admin.wa.saving") : tr("admin.wa.save")}
      </button>

      {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
    </form>
  );
}
