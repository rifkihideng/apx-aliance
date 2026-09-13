import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export default async function Loading() {
  const lang = await getLang();

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-400" />
      <p className="mt-4 text-sm text-zinc-400">{t(lang, "common.loading")}</p>
    </div>
  );
}
