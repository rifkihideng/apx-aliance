"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ContentItem } from "@/lib/types";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type Section = "faq" | "rules";

type FormState = {
  id: number | null;
  title_id: string;
  title_en: string;
  body_id: string;
  body_en: string;
};

const emptyForm: FormState = {
  id: null,
  title_id: "",
  title_en: "",
  body_id: "",
  body_en: "",
};

export default function ContentManager({ section, lang }: { section: Section; lang: Lang }) {
  const tr = (key: string) => t(lang, key);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`/api/content?section=${section}`);
    const json = await res.json();
    if (json.ok) setItems(json.items);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/content?section=${section}`);
      const json = await res.json();
      if (!cancelled && json.ok) setItems(json.items);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [section]);

  function startEdit(item: ContentItem) {
    setForm({
      id: item.id,
      title_id: item.title_id,
      title_en: item.title_en ?? "",
      body_id: item.body_id ?? "",
      body_en: item.body_en ?? "",
    });
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

    try {
      const res = form.id
        ? await fetch(`/api/content/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title_id: form.title_id,
              title_en: form.title_en,
              body_id: form.body_id,
              body_en: form.body_en,
            }),
          })
        : await fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section,
              title_id: form.title_id,
              title_en: form.title_en,
              body_id: form.body_id,
              body_en: form.body_en,
            }),
          });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.content.error"));
      setMessage(form.id ? tr("admin.content.updated") : tr("admin.content.added"));
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.content.error"));
    } finally {
      setSaving(false);
    }
  }

  async function move(item: ContentItem, direction: "up" | "down") {
    setBusyId(item.id);
    setMessage("");
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.content.error"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.content.error"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: ContentItem) {
    if (!window.confirm(tr("admin.content.confirmDelete"))) return;
    try {
      const res = await fetch(`/api/content/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.content.deleteFail"));
      setMessage(tr("admin.content.deleted"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.content.deleteFail"));
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  const title = section === "faq" ? tr("admin.content.faqTitle") : tr("admin.content.rulesTitle");
  const subtitle =
    section === "faq" ? tr("admin.content.faqSubtitle") : tr("admin.content.rulesSubtitle");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
      <p className="mt-2 text-zinc-400">{subtitle}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {form.id ? tr("admin.content.edit") : tr("admin.content.add")}
          </h2>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            >
              {tr("admin.content.cancelEdit")}
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("admin.content.titleId")}
            </span>
            <input
              className={inputCls}
              value={form.title_id}
              onChange={(e) => setForm((f) => ({ ...f, title_id: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("admin.content.titleEn")}
            </span>
            <input
              className={inputCls}
              value={form.title_en}
              onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("admin.content.bodyId")}
            </span>
            <textarea
              className={inputCls}
              rows={3}
              value={form.body_id}
              onChange={(e) => setForm((f) => ({ ...f, body_id: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">
              {tr("admin.content.bodyEn")}
            </span>
            <textarea
              className={inputCls}
              rows={3}
              value={form.body_en}
              onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))}
            />
          </label>
        </div>

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving
            ? tr("admin.content.saving")
            : form.id
              ? tr("admin.content.save")
              : tr("admin.content.addBtn")}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">
          {tr("admin.content.list")} ({items.length})
        </h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">{tr("admin.content.loading")}</p>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
            {tr("admin.content.empty")}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-100">{item.title_id}</h3>
                    {item.body_id && <p className="mt-1 text-sm text-zinc-400">{item.body_id}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={i === 0 || busyId === item.id}
                      onClick={() => move(item, "up")}
                      aria-label={tr("admin.content.up")}
                      title={tr("admin.content.up")}
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === items.length - 1 || busyId === item.id}
                      onClick={() => move(item, "down")}
                      aria-label={tr("admin.content.down")}
                      title={tr("admin.content.down")}
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400"
                    >
                      {tr("admin.content.editBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-red-500 hover:text-red-400"
                    >
                      {tr("admin.content.delete")}
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
