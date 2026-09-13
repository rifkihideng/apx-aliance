"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { translate as t, type Lang } from "@/i18n/dictionaries";

function detectLang(): Lang {
  if (typeof document === "undefined") return "id";
  const match = document.cookie.match(/(?:^|;\s*)lang=(en|id)/);
  return match ? (match[1] as Lang) : "id";
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang] = useState<Lang>(detectLang);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{t(lang, "error.title")}</h1>
      <p className="mt-3 text-zinc-400">{t(lang, "error.desc")}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary rounded-lg px-5 py-2.5 font-semibold text-emerald-950"
        >
          {t(lang, "error.retry")}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-700 px-5 py-2.5 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
        >
          {t(lang, "error.home")}
        </Link>
      </div>
    </div>
  );
}
