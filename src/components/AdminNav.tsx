"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { translate as t, type Lang } from "@/i18n/dictionaries";
import AdminLogoutButton from "./AdminLogoutButton";

const links = [
  { href: "/admin", key: "admin.nav.applications" },
  { href: "/admin/member", key: "admin.nav.members" },
  { href: "/admin/berita", key: "admin.nav.news" },
  { href: "/admin/jadwal", key: "admin.nav.schedule" },
  { href: "/admin/faq", key: "admin.nav.faq" },
  { href: "/admin/aturan", key: "admin.nav.rules" },
];

export default function AdminNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const tr = (key: string) => t(lang, key);

  return (
    <div className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/30">
              APX
            </span>
            <span className="text-sm font-bold tracking-wide text-zinc-100">{tr("admin.nav.title")}</span>
          </Link>

          <nav className="hidden gap-1 text-sm font-medium text-zinc-400 sm:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "hover:bg-zinc-900 hover:text-emerald-400"
                  }`}
                >
                  {tr(l.key)}
                </Link>
              );
            })}
          </nav>
        </div>

        <AdminLogoutButton lang={lang} />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 text-sm font-medium text-zinc-400 sm:hidden">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "hover:bg-zinc-900 hover:text-emerald-400"
              }`}
            >
              {tr(l.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
