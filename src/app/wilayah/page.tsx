import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wilayah APX",
  description: "Wilayah yang dikuasai aliansi APX di Narco Empire.",
};

export default async function WilayahPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);
  const territories = await getContent("territories", lang);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("wilayah.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("wilayah.subtitle")}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {territories.map((item, i) => (
          <Reveal key={item.id} delay={i * 60}>
            <div className="card-lift h-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden="true">
                  📍
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {tr("wilayah.badge")}
                </span>
              </div>
              <h2 className="mt-3 font-semibold text-zinc-100">{item.title}</h2>
              {item.body && <p className="mt-1 text-sm text-zinc-400">{item.body}</p>}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
