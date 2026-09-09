import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Aturan Aliansi" };

const ruleKeys = ["1", "2", "3", "4", "5", "6"];

export default async function AturanPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("rules.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("rules.subtitle")}</p>

      <ol className="mt-10 space-y-4">
        {ruleKeys.map((r, i) => (
          <Reveal key={r} delay={i * 80}>
            <li className="card-lift flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-zinc-950">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold text-zinc-100">{tr(`rules.${r}.title`)}</h2>
                <p className="mt-1 text-sm text-zinc-400">{tr(`rules.${r}.desc`)}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
