"use client";

import Link from "next/link";
import { useState } from "react";
import { translate as t, type Lang } from "@/i18n/dictionaries";
import LanguageToggle from "./LanguageToggle";
import PushSubscribe from "./PushSubscribe";

const links = [
  { href: "/", key: "nav.home" },
  { href: "/roster", key: "nav.roster" },
  { href: "/rekrut", key: "nav.rekrut" },
  { href: "/berita", key: "nav.berita" },
  { href: "/jadwal", key: "nav.jadwal" },
  { href: "/aturan", key: "nav.aturan" },
  { href: "/admin", key: "nav.admin" },
];

export default function Navbar({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const tr = (key: string) => t(lang, key);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 shadow-lg shadow-emerald-500/5 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 font-black text-zinc-950">
            APX
          </span>
          <span className="text-lg font-bold tracking-wide">APX Alliance</span>
        </Link>

        <div className="flex items-center gap-3">
          <ul className="hidden gap-6 text-sm font-medium text-zinc-300 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-emerald-400">
                  {tr(l.key)}
                </Link>
              </li>
            ))}
          </ul>
          <LanguageToggle lang={lang} />
          <div className="hidden md:block">
            <PushSubscribe />
          </div>
          <Link
            href="/rekrut"
            className="btn-primary hidden rounded-lg px-4 py-2 text-sm font-semibold text-zinc-950 md:inline-flex"
          >
            {tr("nav.join")}
          </Link>
          <button
            type="button"
            aria-label={tr("nav.openMenu")}
            onClick={() => setOpen(!open)}
            className="rounded-md border border-zinc-700 p-2 text-zinc-300 md:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-2 pt-2 text-sm font-medium text-zinc-300">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 transition-colors hover:bg-zinc-900 hover:text-emerald-400"
                >
                  {tr(l.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/rekrut"
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 block rounded-md px-2 py-2 text-center font-semibold text-zinc-950"
              >
                {tr("nav.join")}
              </Link>
            </li>
            <li className="mt-1">
              <PushSubscribe />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
