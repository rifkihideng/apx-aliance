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
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-5 w-5 text-emerald-950"
                  >
                    <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
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
