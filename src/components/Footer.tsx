import { getSetting } from "@/lib/db";
import { translate as t, type Lang } from "@/i18n/dictionaries";

export default async function Footer({ lang }: { lang: Lang }) {
  let discordLink = "";
  try {
    discordLink = await getSetting("discord_link");
  } catch {
    // Jika database tidak tersedia, footer tetap tampil tanpa link.
  }

  return (
    <footer className="relative overflow-hidden border-t border-zinc-800 bg-zinc-950 py-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center text-sm text-zinc-500 sm:px-6">
        <p className="font-semibold text-zinc-300">APX Alliance — Narco Empire</p>
        <p className="mt-2">{t(lang, "footer.disclaimer")}</p>
        {discordLink && (
          <a
            href={discordLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            {t(lang, "footer.discord")}
          </a>
        )}
      </div>
    </footer>
  );
}
