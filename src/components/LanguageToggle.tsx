"use client";

import type { Lang } from "@/i18n/dictionaries";

export default function LanguageToggle({ lang }: { lang: Lang }) {
  function toggle() {
    const next = lang === "id" ? "en" : "id";
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400"
      title={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      {lang === "id" ? "EN" : "ID"}
    </button>
  );
}
