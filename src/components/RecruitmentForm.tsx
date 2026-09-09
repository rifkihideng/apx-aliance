"use client";

import { useState, type FormEvent } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";

type FieldProps = {
  label: string;
  name: string;
  textarea?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
};

function Field({ label, name, textarea, required, placeholder, type }: FieldProps) {
  const base =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-300">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={4} className={base} />
      ) : (
        <input name={name} required={required} placeholder={placeholder} type={type ?? "text"} className={base} />
      )}
    </label>
  );
}

export default function RecruitmentForm({ lang }: { lang: Lang }) {
  const tr = (key: string) => t(lang, key);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ign: data.get("ign"),
          level: data.get("level"),
          discord: data.get("discord"),
          alasan: data.get("alasan"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Terjadi kesalahan.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-400">{tr("form.success")}</p>
        <p className="mt-2 text-sm text-zinc-300">{tr("form.successDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={tr("form.ign")} name="ign" placeholder={tr("form.ignPh")} required />
      <Field label={tr("form.level")} name="level" type="number" placeholder={tr("form.levelPh")} />
      <Field label={tr("form.discord")} name="discord" placeholder={tr("form.discordPh")} />
      <Field
        label={tr("form.alasan")}
        name="alasan"
        textarea
        required
        placeholder={tr("form.alasanPh")}
      />

      {status === "error" && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {status === "loading" ? tr("form.sending") : tr("form.submit")}
      </button>
    </form>
  );
}
