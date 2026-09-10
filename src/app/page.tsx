import Link from "next/link";
import { dbGet } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { translate as t, monthNames, type Lang } from "@/i18n/dictionaries";
import Reveal from "@/components/Reveal";
import Parallax from "@/components/Parallax";
import Countdown from "@/components/Countdown";
import { formatTimeZones } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  const total = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members"))?.c ?? 0;
  const aktif = (await dbGet<{ c: number }>("SELECT COUNT(*) AS c FROM members WHERE active = 1"))?.c ?? 0;
  const nextEvent = await dbGet<{ title: string; event_date: string; event_time: string | null }>(
    "SELECT title, event_date, event_time FROM events WHERE date(event_date) >= date('now', 'localtime') ORDER BY event_date ASC, event_time ASC LIMIT 1"
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <Parallax speed={0.35} className="pointer-events-none absolute -top-40 left-1/2">
          <div className="h-96 w-[42rem] -translate-x-1/2">
            <div
              className="animate-glow h-full w-full rounded-full bg-emerald-500/20 blur-3xl"
              aria-hidden="true"
            />
          </div>
        </Parallax>
        <Parallax speed={0.2} className="pointer-events-none absolute -bottom-24 -right-24">
          <div
            className="h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden="true"
          />
        </Parallax>
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="animate-fade-up text-sm font-semibold uppercase tracking-widest text-emerald-400">
            {tr("home.tagline")}
          </p>
          <h1 className="animate-fade-up mt-4 text-5xl font-black tracking-tight sm:text-7xl">
            APX <span className="text-gradient">ALLIANCE</span>
          </h1>
          <p className="animate-fade-up mt-6 max-w-2xl text-lg text-zinc-400">
            {tr("home.subtitle")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-4">
            <Link
              href="/rekrut"
              className="btn-primary rounded-lg px-6 py-3 font-semibold text-zinc-950"
            >
              {tr("home.join")}
            </Link>
            <Link
              href="/roster"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
            >
              {tr("home.roster")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-zinc-900/50">
        <Reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
            <Stat label={tr("home.totalMember")} value={total} icon={<UsersIcon />} />
            <Stat label={tr("home.activeMember")} value={aktif} icon={<ActivityIcon />} />
            <Stat label={tr("home.server")} value="20" icon={<ServerIcon />} />
          </div>
        </Reveal>
      </section>

      {nextEvent && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <div className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                {tr("home.countdown.title")}
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{nextEvent.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                {formatEventDate(nextEvent.event_date, lang)}
              </p>
              {nextEvent.event_time && (
                <p className="mt-1 text-xs text-zinc-500">
                  {formatTimeZones(nextEvent.event_time)}
                </p>
              )}
              <div className="mt-6">
                <Countdown
                  date={nextEvent.event_date}
                  time={nextEvent.event_time}
                  labels={{
                    days: tr("home.countdown.days"),
                    hours: tr("home.countdown.hours"),
                    mins: tr("home.countdown.mins"),
                    secs: tr("home.countdown.secs"),
                  }}
                />
              </div>
            </div>
          </Reveal>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">{tr("home.why")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <Feature title={tr("home.f1.title")} desc={tr("home.f1.desc")} icon={<TargetIcon />} />
          </Reveal>
          <Reveal delay={120}>
            <Feature title={tr("home.f2.title")} desc={tr("home.f2.desc")} icon={<ChartIcon />} />
          </Reveal>
          <Reveal delay={240}>
            <Feature title={tr("home.f3.title")} desc={tr("home.f3.desc")} icon={<HeartIcon />} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function formatEventDate(date: string, lang: Lang) {
  const [y, m, d] = date.split("-");
  const month = monthNames[lang][Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card-lift rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <p className="text-3xl font-black text-emerald-400">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="card-lift h-full rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-emerald-400">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}

const iconCls = "h-5 w-5";

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
