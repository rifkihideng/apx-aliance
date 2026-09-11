import { dbAll } from "@/lib/db";
import type { EventItem } from "@/lib/types";
import { getLang } from "@/lib/lang";
import { translate as t, monthNames, type Lang } from "@/i18n/dictionaries";
import { formatTimeZones } from "@/lib/time";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jadwal",
  description: "Jadwal war dan event aliansi APX di Narco Empire.",
};

function formatDate(date: string, lang: Lang) {
  const [y, m, d] = date.split("-");
  const month = monthNames[lang][Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

export default async function JadwalPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const events = await dbAll<EventItem>(
    "SELECT e.id, e.title, e.event_date, e.event_time, e.description, et.name AS type, e.created_at FROM events e JOIN event_types et ON et.id = e.type_id ORDER BY e.event_date ASC"
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("schedule.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("schedule.subtitle")}</p>

      {events.length === 0 ? (
        <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-10 text-center text-zinc-400">
          {tr("schedule.empty")}
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={i * 80}>
              <div className="card-lift flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-500 text-emerald-950">
                  <span className="text-lg font-black leading-none">
                    {e.event_date.split("-")[2]}
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {e.event_date.split("-")[1]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-zinc-100">{e.title}</h2>
                    {e.type === "perang" && (
                      <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
                        ⚔️ {tr("event.badge.perang")}
                      </span>
                    )}
                    {e.type === "perebutan" && (
                      <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-300">
                        🚩 {tr("event.badge.perebutan")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{formatDate(e.event_date, lang)}</p>
                  {e.event_time && (
                    <p className="mt-1 text-xs text-zinc-500">{formatTimeZones(e.event_time)}</p>
                  )}
                  {e.description && (
                    <p className="mt-2 text-sm text-zinc-300">{e.description}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
