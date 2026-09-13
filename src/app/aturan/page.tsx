import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Aturan Aliansi",
  description: "Aturan yang wajib dipatuhi seluruh member aliansi APX.",
};

export default async function AturanPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);
  const rules = await getContent("rules", lang);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("rules.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("rules.subtitle")}</p>

      <ol className="mt-10 space-y-4">
        {rules.map((rule, i) => (
          <Reveal key={rule.id} delay={i * 80}>
            <li className="card-lift flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-emerald-950">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold text-zinc-100">{rule.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">{rule.body}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
