import { dbAll } from "@/lib/db";
import type { Member } from "@/lib/types";
import RosterClient from "@/components/RosterClient";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roster",
  description: "Daftar member aliansi APX di game Narco Empire.",
};

export default async function RosterPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const members = await dbAll<Member>(
    // Denormalisasi: v_members sudah memuat role/pangkat dari kolom salinan,
    // jadi tidak ada JOIN di sini dan `role_order` sudah dihitung di view.
    `SELECT id, ign, role, pangkat, level, discord, joined_at, active
     FROM v_members
     ORDER BY role_order ASC, level DESC`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("roster.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("roster.subtitle")}</p>

      <div className="mt-8">
        <RosterClient members={members} lang={lang} />
      </div>
    </div>
  );
}
