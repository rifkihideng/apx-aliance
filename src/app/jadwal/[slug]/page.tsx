import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { dbGet } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { translate as t, monthNames, type Lang } from "@/i18n/dictionaries";
import { formatTimeZones } from "@/lib/time";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

type EventRow = {
  id: number;
  title: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  type: string;
  created_at: string;
};

function formatDate(date: string, lang: Lang) {
  const [y, m, d] = date.split("-");
  const month = monthNames[lang][Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await dbGet<{ title: string }>(
    "SELECT title FROM v_events WHERE slug = ?",
    slug
  );
  return { title: event?.title ?? "Jadwal" };
}

export default async function JadwalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const event = await dbGet<EventRow>(
    "SELECT id, title, event_date, event_time, description, type, created_at FROM v_events WHERE slug = ?",
    slug
  );

  if (!event) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/jadwal"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
      >
        {tr("schedule.back")}
      </Link>

      <article className="card-lift mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black sm:text-4xl">{event.title}</h1>
          {event.type === "perang" && (
            <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              ⚔️ {tr("event.badge.perang")}
            </span>
          )}
          {event.type === "perebutan" && (
            <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-300">
              🚩 {tr("event.badge.perebutan")}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-zinc-400">{formatDate(event.event_date, lang)}</p>
        {event.event_time && (
          <p className="mt-1 text-xs text-zinc-500">{formatTimeZones(event.event_time)}</p>
        )}

        {event.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {event.description}
          </p>
        )}
      </article>
    </div>
  );
}
