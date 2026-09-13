"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Lang } from "@/i18n/dictionaries";

const WORDS: Record<Lang, string[]> = {
  id: ["Kekuatan", "Strategi", "Solidaritas", "Dominasi"],
  en: ["Power", "Strategy", "Solidarity", "Dominance"],
};

export default function Intro({ lang }: { lang: Lang }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Portal harus dipasang setelah mount supaya HTML server & klien identik
    // (menghindari hydration mismatch). Ini pola yang disarankan React untuk portal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(document.body);
  }, []);

  useEffect(() => {
    if (!container) return;

    const words = WORDS[lang];
    const wordTimer = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 800);

    const leaveTimer = setTimeout(() => setLeaving(true), 4500);
    const goneTimer = setTimeout(() => setGone(true), 5100);

    return () => {
      clearInterval(wordTimer);
      clearTimeout(leaveTimer);
      clearTimeout(goneTimer);
    };
  }, [container, lang]);

  if (!container || gone) return null;

  const words = WORDS[lang];

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-zinc-950 transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={leaving}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(640px_320px_at_50%_45%,rgba(16,185,129,0.16),transparent)]"
      />

      <div className="animate-fade-up flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl font-black text-emerald-950 shadow-xl shadow-emerald-500/30">
        APX
      </div>

      <p className="animate-fade-up text-xl font-black tracking-[0.2em] text-zinc-100 sm:text-2xl sm:tracking-[0.35em]">
        APX ALLIANCE
      </p>

      <div className="flex h-12 items-center overflow-hidden">
        <span
          key={wordIndex}
          className="animate-word text-4xl font-black uppercase tracking-tight text-gradient"
        >
          {words[wordIndex]}
        </span>
      </div>
    </div>,
    container
  );
}
