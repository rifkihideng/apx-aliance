"use client";

import { useState } from "react";
import type { Theme } from "@/lib/theme";

export default function ThemeToggle({ theme }: { theme: Theme }) {
  const [isLight, setIsLight] = useState(theme === "light");

  function toggle() {
    const next = !isLight;
    setIsLight(next);

    const html = document.documentElement;
    html.classList.add("theme-transition");
    if (next) html.classList.add("light");
    else html.classList.remove("light");

    document.cookie = `theme=${next ? "light" : "dark"}; path=/; max-age=31536000; samesite=lax`;

    window.setTimeout(() => html.classList.remove("theme-transition"), 350);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
      title={isLight ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400"
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
