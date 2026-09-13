import Link from "next/link";
import { getLang } from "@/lib/lang";
import { translate as t } from "@/i18n/dictionaries";

export default async function NotFound() {
  const lang = await getLang();
  const tr = (key: string) => t(lang, key);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="text-7xl font-black text-emerald-400">404</p>
      <h1 className="mt-4 text-3xl font-black sm:text-4xl">{tr("notFound.title")}</h1>
      <p className="mt-3 text-zinc-400">{tr("notFound.desc")}</p>
      <Link
        href="/"
        className="btn-primary mt-8 inline-block rounded-lg px-6 py-3 font-semibold text-emerald-950"
      >
        {tr("notFound.home")}
      </Link>
    </div>
  );
}
