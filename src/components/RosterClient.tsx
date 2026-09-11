"use client";

import { useMemo, useState } from "react";
import type { Member } from "@/lib/types";
import { translate as t, type Lang } from "@/i18n/dictionaries";

const roleColors: Record<string, string> = {
  Ketua: "bg-emerald-500 text-emerald-950",
  Wakil: "bg-emerald-400/20 text-emerald-300",
  Pengurus: "bg-sky-500/20 text-sky-300",
  Member: "bg-zinc-700/40 text-zinc-300",
};

export default function RosterClient({ members, lang }: { members: Member[]; lang: Lang }) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  const roles = useMemo(() => {
    const set = new Set(members.map((m) => m.role));
    return Array.from(set);
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const matchQuery =
        !q ||
        m.ign.toLowerCase().includes(q) ||
        (m.pangkat ?? "").toLowerCase().includes(q);
      const matchRole = role === "all" || m.role === role;
      return matchQuery && matchRole;
    });
  }, [members, query, role]);

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputCls}
          placeholder={tr("roster.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${inputCls} sm:w-48`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="all">{tr("roster.allRoles")}</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        {tr("roster.showing", { a: filtered.length, b: members.length })}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <div key={m.id} className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-lg font-bold">{m.ign}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  roleColors[m.role] ?? "bg-zinc-700 text-zinc-300"
                }`}
              >
                {m.role}
              </span>
            </div>
            <dl className="mt-4 space-y-1 text-sm text-zinc-400">
              <div className="flex justify-between">
                <dt>{tr("roster.pangkat")}</dt>
                <dd className="text-zinc-200">{m.pangkat ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{tr("roster.level")}</dt>
                <dd className="text-zinc-200">{m.level ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{tr("roster.discord")}</dt>
                <dd className="text-zinc-200">{m.discord ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{tr("roster.joined")}</dt>
                <dd className="text-zinc-200">{m.joined_at ?? "-"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
          {tr("roster.none")}
        </div>
      )}
    </div>
  );
}
