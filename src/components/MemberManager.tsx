"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Member } from "@/lib/types";

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

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/members");
    const json = await res.json();
    if (json.ok) setMembers(json.members);
    setLoading(false);
  }

  useEffect(() => {
    load();
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Terjadi kesalahan.");
      setMessage(form.id ? "Member berhasil diperbarui." : "Member berhasil ditambahkan.");
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, ign: string) {
    if (!window.confirm(`Hapus member "${ign}"?`)) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Gagal menghapus.");
      setMessage("Member berhasil dihapus.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">Kelola Member</h1>
      <p className="mt-2 text-zinc-400">Tambah, edit, atau hapus member aliansi APX.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {form.id ? "Edit Member" : "Tambah Member"}
          </h2>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
            >
              Batal Edit
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">IGN</span>
            <input
              className={inputCls}
              value={form.ign}
              onChange={(e) => update("ign", e.target.value)}
              placeholder="Contoh: Apx.Nova"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">Role</span>
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
            <span className="mb-1 block text-sm font-medium text-zinc-300">Pangkat</span>
            <input
              className={inputCls}
              value={form.pangkat}
              onChange={(e) => update("pangkat", e.target.value)}
              placeholder="Contoh: R4"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">Level</span>
            <input
              className={inputCls}
              type="number"
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              placeholder="Contoh: 150"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">Discord</span>
            <input
              className={inputCls}
              value={form.discord}
              onChange={(e) => update("discord", e.target.value)}
              placeholder="Contoh: apxnova"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-300">Bergabung</span>
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
          className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Tambah Member"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Daftar Member ({members.length})</h2>
        {loading ? (
          <p className="mt-4 text-zinc-400">Memuat...</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">IGN</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Pangkat</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-zinc-800">
                    <td className="px-4 py-3 font-medium text-zinc-100">{m.ign}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.role}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.pangkat ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.level ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-400 hover:text-emerald-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.ign)}
                        className="ml-2 rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                      >
                        Hapus
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
