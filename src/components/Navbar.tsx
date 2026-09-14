"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { translate as t, type Lang } from "@/i18n/dictionaries";
import type { Theme } from "@/lib/theme";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import PushSubscribe from "./PushSubscribe";

const mainLinks = [
  { href: "/", key: "nav.home" },
  { href: "/roster", key: "nav.roster" },
  { href: "/rekrut", key: "nav.rekrut" },
  { href: "/berita", key: "nav.berita" },
  { href: "/jadwal", key: "nav.jadwal" },
];

const infoLinks = [
  { href: "/aturan", key: "nav.aturan" },
  { href: "/wilayah", key: "nav.wilayah" },
  { href: "/faq", key: "nav.faq" },
];

const allLinks = [
  ...mainLinks,
  ...infoLinks,
  { href: "/admin", key: "nav.admin" },
];

export default function Navbar({ lang, theme }: { lang: Lang; theme: Theme }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const tr = (key: string) => t(lang, key);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const linkCls = (href: string) =>
    `rounded-md px-3 py-2 transition-colors hover:text-emerald-400 ${
      isActive(href) ? "text-emerald-400" : "text-zinc-300"
    }`;

  const infoActive = infoLinks.some((l) => isActive(l.href));

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur transition-all duration-300 ${
        scrolled
          ? "border-zinc-700/70 bg-zinc-950/90 shadow-lg shadow-emerald-500/10"
          : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-mark.svg"
            alt="APEX RISE"
            width={120}
            height={120}
            className="h-9 w-9"
            priority
          />
          <span className="text-lg font-bold tracking-wide">APX Alliance</span>
        </Link>

        <div className="flex items-center gap-3">
          <ul className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {mainLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkCls(l.href)}>
                  {tr(l.key)}
                </Link>
              </li>
            ))}

            <li className="group relative">
              <button
                type="button"
                className={`flex items-center gap-1 rounded-md px-3 py-2 transition-colors hover:text-emerald-400 ${
                  infoActive ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {tr("nav.info")}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-44 rounded-xl border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur">
                  {infoLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-zinc-900 hover:text-emerald-400 ${
                        isActive(l.href) ? "text-emerald-400" : "text-zinc-300"
                      }`}
                    >
                      {tr(l.key)}
                    </Link>
                  ))}
                </div>
              </div>
            </li>

            <li>
              <Link href="/admin" className={linkCls("/admin")}>
                {tr("nav.admin")}
              </Link>
            </li>
          </ul>
          <LanguageToggle lang={lang} />
          <ThemeToggle theme={theme} />
          <div className="hidden xl:block">
            <PushSubscribe />
          </div>
          <Link
            href="/rekrut"
            className="btn-primary hidden rounded-lg px-4 py-2 text-sm font-semibold text-emerald-950 lg:inline-flex"
          >
            {tr("nav.join")}
          </Link>
          <button
            type="button"
            aria-label={tr("nav.openMenu")}
            onClick={() => setOpen(!open)}
            className="rounded-md border border-zinc-700 p-2 text-zinc-300 lg:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 lg:hidden">
          <ul className="flex flex-col gap-2 pt-2 text-sm font-medium text-zinc-300">
            {allLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2 py-2 transition-colors hover:bg-zinc-900 hover:text-emerald-400 ${
                    isActive(l.href) ? "bg-emerald-500/10 text-emerald-400" : ""
                  }`}
                >
                  {tr(l.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/rekrut"
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 block rounded-md px-2 py-2 text-center font-semibold text-emerald-950"
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
