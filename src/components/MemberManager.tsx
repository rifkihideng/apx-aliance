"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Member } from "@/lib/types";
import { translate as t, type Lang } from "@/i18n/dictionaries";

const ROLES = ["Ketua", "Wakil", "Pengurus", "Member"];

type FormState = {
  id: number | null;
  ign: string;
  role: string;
  pangkat: string;
  level: string;
  discord: string;
  joined_at: string;
};

const emptyForm: FormState = {
  id: null,
  ign: "",
  role: "Member",
  pangkat: "",
  level: "",
  discord: "",
  joined_at: "",
};

export default function MemberManager({ lang }: { lang: Lang }) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/members");
    const json = await res.json();
    if (json.ok) setMembers(json.members);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/members");
      const json = await res.json();
      if (cancelled) return;
      if (json.ok) setMembers(json.members);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(m: Member) {
    setForm({
      id: m.id,
      ign: m.ign,
      role: m.role,
      pangkat: m.pangkat ?? "",
      level: m.level != null ? String(m.level) : "",
      discord: m.discord ?? "",
      joined_at: m.joined_at ?? "",
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
      ign: form.ign,
      role: form.role,
      pangkat: form.pangkat,
      level: form.level,
      discord: form.discord,
      joined_at: form.joined_at,
    };

    try {
      const res = form.id
        ? await fetch(`/api/members/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.member.error"));
      setMessage(form.id ? tr("admin.member.updated") : tr("admin.member.added"));
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.member.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, ign: string) {
    if (!window.confirm(tr("admin.member.confirmDelete", { name: ign }))) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.member.deleteFail"));
      setMessage(tr("admin.member.deleted"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.member.deleteFail"));
    }
  }

  async function toggleActive(m: Member) {
    setBusyId(m.id);
    setMessage("");
    try {
      const res = await fetch(`/api/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: m.active ? 0 : 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? tr("admin.member.error"));
      setMessage(tr("admin.member.activeToggled"));
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : tr("admin.member.error"));
    } finally {
      setBusyId(null);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("admin.member.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("admin.member.subtitle")}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {form.id ? tr("admin.member.edit") : tr("admin.member.add")}
          </h2>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            >
              {tr("admin.member.cancelEdit")}
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.ign")}</span>
            <input
              className={inputCls}
              value={form.ign}
              onChange={(e) => update("ign", e.target.value)}
              placeholder={tr("admin.member.ignPh")}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.role")}</span>
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.rank")}</span>
            <input
              className={inputCls}
              value={form.pangkat}
              onChange={(e) => update("pangkat", e.target.value)}
              placeholder={tr("admin.member.rankPh")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.level")}</span>
            <input
              className={inputCls}
              type="number"
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              placeholder={tr("admin.member.levelPh")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.discord")}</span>
            <input
              className={inputCls}
              value={form.discord}
              onChange={(e) => update("discord", e.target.value)}
              placeholder={tr("admin.member.discordPh")}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">{tr("admin.member.joined")}</span>
            <input
              className={inputCls}
              value={form.joined_at}
              onChange={(e) => update("joined_at", e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
        </div>

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? tr("admin.member.saving") : form.id ? tr("admin.member.save") : tr("admin.member.addBtn")}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">{tr("admin.member.list")} ({members.length})</h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">{tr("admin.member.loading")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{tr("admin.member.ign")}</th>
                  <th className="px-4 py-3 font-medium">{tr("admin.member.role")}</th>
                  <th className="px-4 py-3 font-medium">{tr("admin.member.rank")}</th>
                  <th className="px-4 py-3 font-medium">{tr("admin.member.level")}</th>
                  <th className="px-4 py-3 font-medium text-right">{tr("admin.member.action")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className={`border-t border-zinc-800 ${m.active ? "" : "opacity-60"}`}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-100">{m.ign}</span>
                      {!m.active && (
                        <span className="ml-2 rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {tr("admin.member.inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{m.role}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.pangkat ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.level ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => toggleActive(m)}
                        className={`rounded-md border px-3 py-1 text-xs transition-colors disabled:opacity-60 ${
                          m.active
                            ? "border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-400"
                            : "border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        {m.active ? tr("admin.member.deactivate") : tr("admin.member.activate")}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="ml-2 rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
                      >
                        {tr("admin.member.editBtn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.ign)}
                        className="ml-2 rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                      >
                        {tr("admin.member.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
