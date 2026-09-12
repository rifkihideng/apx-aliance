"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { EventItem } from "@/lib/types";
import { convertTimeZones, formatTimeZones } from "@/lib/time";
import { translate as t, type Lang } from "@/i18n/dictionaries";

const TYPE_COLORS: Record<string, string> = {
  event: "bg-zinc-700/40 text-zinc-300",
  perebutan: "bg-orange-500/20 text-orange-300",
  perang: "bg-red-500/20 text-red-300",
  rapat: "bg-sky-500/20 text-sky-300",
};

type FormState = {
  id: number | null;
  title: string;
  event_date: string;
  event_time: string;
  description: string;
  type: string;
};

const emptyForm: FormState = {
  id: null,
  title: "",
  event_date: "",
  event_time: "",
  description: "",
  type: "event",
};

export default function EventManager({ lang }: { lang: Lang }) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
  const typeLabel = (type: string) => {
    switch (type) {
      case "perang":
        return tr("admin.schedule.type.war");
      case "perebutan":
        return tr("admin.schedule.type.capture");
      case "rapat":
        return tr("admin.schedule.type.meeting");
      default:
        return tr("admin.schedule.type.event");
    }
  };

  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/events");
    const json = await res.json();
    if (json.ok) setItems(json.events);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/events");
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setItems(json.events);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit(e: EventItem) {
    setForm({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      event_time: e.event_time ?? "",
      description: e.description ?? "",
      type: e.type ?? "event",
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

    const payload = {
      title: form.title,
      event_date: form.event_date,
      event_time: form.event_time,
      description: form.description,
      type: form.type,
    };

    try {
      const res = form.id
        ? await fetch(`/api/events/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.schedule.error"));
      setMessage(form.id ? tr("admin.schedule.updated") : tr("admin.schedule.added"));
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.schedule.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!window.confirm(tr("admin.schedule.confirmDelete", { name: title }))) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.schedule.deleteFail"));
      setMessage(tr("admin.schedule.deleted"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.schedule.deleteFail"));
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  const zones = convertTimeZones(form.event_time);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("admin.schedule.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("admin.schedule.subtitle")}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{form.id ? tr("admin.schedule.edit") : tr("admin.schedule.add")}</h2>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            >
              {tr("admin.schedule.cancelEdit")}
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.schedule.titleField")}</span>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={tr("admin.schedule.titlePh")}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.schedule.date")}</span>
            <input
              className={inputCls}
              type="date"
              value={form.event_date}
              onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.schedule.type")}</span>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="event">{tr("admin.schedule.type.event")}</option>
              <option value="rapat">{tr("admin.schedule.type.meeting")}</option>
              <option value="perebutan">{tr("admin.schedule.type.capture")}</option>
              <option value="perang">{tr("admin.schedule.type.war")}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.schedule.time")}</span>
            <input
              className={inputCls}
              type="time"
              value={form.event_time}
              onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.schedule.description")}</span>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={tr("admin.schedule.descPh")}
            />
          </label>
        </div>

        {zones && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300">
              {zones.wib} WIB
            </span>
            <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-300">
              {zones.wita} WITA
            </span>
            <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-300">
              {zones.wit} WIT
            </span>
            <span className="rounded-md bg-sky-500/10 px-2.5 py-1 font-medium text-sky-300">
              {zones.utc} UTC
            </span>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? tr("admin.schedule.saving") : form.id ? tr("admin.schedule.save") : tr("admin.schedule.addBtn")}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">{tr("admin.schedule.list")} ({items.length})</h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">{tr("admin.schedule.loading")}</p>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
            {tr("admin.schedule.empty")}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((e) => (
              <div key={e.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-100">{e.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          TYPE_COLORS[e.type] ?? TYPE_COLORS.event
                        }`}
                      >
                        {typeLabel(e.type)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{e.event_date}</p>
                    {e.event_time && (
                      <p className="mt-1 text-xs text-zinc-500">{formatTimeZones(e.event_time)}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
                    >
                      {tr("admin.schedule.editBtn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id, e.title)}
                      className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                    >
                      {tr("admin.schedule.delete")}
                    </button>
                  </div>
                </div>
                {e.description && <p className="mt-3 text-sm text-zinc-300">{e.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
