import RecruitmentForm from "@/components/RecruitmentForm";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export const metadata = { title: "Gabung APX" };

export default async function RekrutPage() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">{tr("recruit.title")}</h1>
      <p className="mt-2 text-zinc-400">{tr("recruit.subtitle")}</p>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <RecruitmentForm lang={lang} />
      </div>
    </div>
  );
}
