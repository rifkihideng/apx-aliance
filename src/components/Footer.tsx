import { translate as t, type Lang } from "@/i18n/dictionaries";

export default function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="relative overflow-hidden border-t border-zinc-800 bg-zinc-950 py-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center text-sm text-zinc-500 sm:px-6">
        <p className="font-semibold text-zinc-300">APX Alliance — Narco Empire</p>
        <p className="mt-2">{t(lang, "footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
