"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Announcement } from "@/lib/types";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type FormState = {
  id: number | null;
  title: string;
  content: string;
};

const emptyForm: FormState = { id: null, title: "", content: "" };

export default function AnnouncementManager({ lang }: { lang: Lang }) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/announcements");
    const json = await res.json();
    if (json.ok) setItems(json.announcements);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(a: Announcement) {
    setForm({ id: a.id, title: a.title, content: a.content });
    setMessage("");
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = { title: form.title, content: form.content };

    try {
      const res = form.id
        ? await fetch(`/api/announcements/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.news.error"));
      setMessage(form.id ? tr("admin.news.updated") : tr("admin.news.added"));
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.news.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!window.confirm(tr("admin.news.confirmDelete", { name: title }))) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.news.deleteFail"));
      setMessage(tr("admin.news.deleted"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.news.deleteFail"));
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("admin.news.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("admin.news.subtitle")}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{form.id ? tr("admin.news.edit") : tr("admin.news.add")}</h2>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            >
              {tr("admin.news.cancelEdit")}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.news.titleField")}</span>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={tr("admin.news.titlePh")}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.news.content")}</span>
            <textarea
              className={inputCls}
              rows={4}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={tr("admin.news.contentPh")}
              required
            />
          </label>
        </div>

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? tr("admin.news.saving") : form.id ? tr("admin.news.save") : tr("admin.news.addBtn")}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">{tr("admin.news.list")} ({items.length})</h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">{tr("admin.news.loading")}</p>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
            {tr("admin.news.empty")}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{a.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{a.created_at}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
                    >
                      {tr("admin.news.editBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id, a.title)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                    >
                      {tr("admin.news.delete")}
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
