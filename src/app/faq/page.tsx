import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "FAQ",
  description: "Pertanyaan yang sering diajukan seputar aliansi APX.",
};

export default async function FaqPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);
  const items = await getContent("faq", lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("faq.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("faq.subtitle")}</p>

      <div className="mt-10 space-y-4">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 80}>
            <div className="card-lift rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="font-semibold text-emerald-400">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
