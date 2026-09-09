"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "./AdminLogoutButton";

const links = [
  { href: "/admin", label: "Pendaftar" },
  { href: "/admin/member", label: "Member" },
  { href: "/admin/berita", label: "Berita" },
  { href: "/admin/jadwal", label: "Jadwal" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-zinc-950">
              APX
            </span>
            <span className="text-sm font-bold tracking-wide text-zinc-100">Panel Admin</span>
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
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <AdminLogoutButton />
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
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
