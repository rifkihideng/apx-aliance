"use client";

import { useEffect, useState, type FormEvent } from "react";

export default function WaLinkSettings() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setLink(json.settings.wa_group_link ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_group_link: link }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Gagal.");
      setMessage("Link tersimpan. ✅");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <h2 className="text-lg font-semibold">Pengaturan</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Link grup WhatsApp akan otomatis dikirim ke pendaftar yang disetujui.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={saving || loading}
          className="shrink-0 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
    </form>
  );
}
