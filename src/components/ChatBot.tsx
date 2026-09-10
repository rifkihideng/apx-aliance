"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { monthNames, type Lang } from "@/i18n/dictionaries";
import { formatTimeZones } from "@/lib/time";

type BotLink = { label: string; href: string };
type Message = { from: "bot" | "user"; text: string; links?: BotLink[] };

type Rule = {
  keywords: string[];
  text: Record<Lang, string>;
  links?: Record<Lang, BotLink[]>;
  dynamic?: "next-event";
};

const RULES: Rule[] = [
  {
    keywords: ["halo", "hai", "hi", "hello", "hey", "pagi", "siang", "sore", "malam", "morning", "afternoon", "evening"],
    text: {
      id: "Halo! 👋 Aku APX Bot, asisten virtual aliansi APX. Mau tanya soal rekrutmen, jadwal war, roster, atau aturan?",
      en: "Hello! 👋 I'm APX Bot, the virtual assistant of the APX alliance. Want to ask about recruitment, war schedule, roster, or rules?",
    },
  },
  {
    keywords: ["daftar", "gabung", "join", "rekrut", "register", "apply", "mendaftar", "bergabung", "recruit"],
    text: {
      id: "Kamu bisa daftar lewat menu Rekrut. Isi formulir dengan IGN, level, Discord, dan alasan bergabung. Tim rekrutmen akan menghubungimu lewat Discord.",
      en: "You can apply via the Recruit menu. Fill in the form with your IGN, level, Discord, and reason to join. The recruitment team will contact you via Discord.",
    },
    links: {
      id: [{ label: "Buka Formulir Rekrutmen", href: "/rekrut" }],
      en: [{ label: "Open Recruitment Form", href: "/rekrut" }],
    },
  },
  {
    keywords: ["syarat", "requirement", "kualifikasi", "minimal", "minimum", "level minimal", "kriteria"],
    text: {
      id: "Syaratnya: aktif setiap hari, mau ikut koordinasi lewat Discord, dan mengikuti arahan pengurus. Tidak ada minimal level tertentu, tapi makin tinggi level makin mudah diterima.",
      en: "Requirements: active every day, willing to coordinate via Discord, and follow the leaders' directions. There is no specific level requirement, but the higher your level, the easier it is to be accepted.",
    },
  },
  {
    keywords: ["discord", "wajib discord", "server discord"],
    text: {
      id: "Ya, Discord wajib. Semua koordinasi war, pengumuman, dan pembagian tugas dilakukan di server Discord APX.",
      en: "Yes, Discord is mandatory. All war coordination, announcements, and task assignments happen on the APX Discord server.",
    },
  },
  {
    keywords: ["event terdekat", "event berikutnya", "event selanjutnya", "next event", "upcoming", "jadwal terdekat", "kapan event", "kapan war"],
    text: { id: "", en: "" },
    links: {
      id: [{ label: "Lihat Jadwal", href: "/jadwal" }],
      en: [{ label: "View Schedule", href: "/jadwal" }],
    },
    dynamic: "next-event",
  },
  {
    keywords: ["jadwal", "event", "war", "schedule", "kegiatan", "agenda", "rapat", "perebutan"],
    text: {
      id: "Jadwal war & event bisa dilihat di halaman Jadwal, lengkap dengan waktu WIB, WITA, WIT, dan UTC.",
      en: "War & event schedules are on the Schedule page, complete with WIB, WITA, WIT, and UTC times.",
    },
    links: {
      id: [{ label: "Lihat Jadwal", href: "/jadwal" }],
      en: [{ label: "View Schedule", href: "/jadwal" }],
    },
  },
  {
    keywords: ["roster", "member", "anggota", "daftar member", "list member"],
    text: {
      id: "Daftar member APX ada di halaman Roster. Kamu bisa mencari nama atau pangkat di sana.",
      en: "The APX member list is on the Roster page. You can search by name or rank there.",
    },
    links: {
      id: [{ label: "Lihat Roster", href: "/roster" }],
      en: [{ label: "View Roster", href: "/roster" }],
    },
  },
  {
    keywords: ["berita", "news", "pengumuman", "info", "update", "kabar", "announcement"],
    text: {
      id: "Berita & pengumuman terbaru ada di halaman Berita.",
      en: "The latest news & announcements are on the News page.",
    },
    links: {
      id: [{ label: "Lihat Berita", href: "/berita" }],
      en: [{ label: "View News", href: "/berita" }],
    },
  },
  {
    keywords: ["aturan", "rules", "peraturan", "ketentuan", "rule"],
    text: {
      id: "Aturan aliansi lengkap bisa dibaca di halaman Aturan.",
      en: "The full alliance rules are on the Rules page.",
    },
    links: {
      id: [{ label: "Lihat Aturan", href: "/aturan" }],
      en: [{ label: "View Rules", href: "/aturan" }],
    },
  },
  {
    keywords: ["lama", "berapa lama", "proses", "seleksi", "kapan diterima", "kapan dihubungi", "how long", "berapa hari"],
    text: {
      id: "Proses seleksi biasanya 1–2 hari. Pastikan Discord-mu aktif agar tidak terlewat.",
      en: "The selection process usually takes 1–2 days. Make sure your Discord is active so you don't miss anything.",
    },
  },
  {
    keywords: ["target", "kuota", "mingguan", "kontribusi", "target mingguan"],
    text: {
      id: "Ada target kontribusi aliansi yang disesuaikan dengan level dan pangkatmu.",
      en: "There are alliance contribution targets adjusted to your level and rank.",
    },
  },
  {
    keywords: ["sanksi", "melanggar", "pelanggaran", "dikeluarkan", "banned", "dipecat", "kick"],
    text: {
      id: "Pelanggaran dikenai sanksi bertingkat: peringatan, penurunan pangkat, hingga dikeluarkan dari aliansi.",
      en: "Violations are subject to tiered sanctions: warning, rank demotion, or removal from the alliance.",
    },
  },
  {
    keywords: ["admin", "kontak", "pengurus", "contact", "hubungi", "cs"],
    text: {
      id: "Untuk pertanyaan lebih lanjut, silakan hubungi pengurus lewat server Discord APX.",
      en: "For further questions, please contact the leaders on the APX Discord server.",
    },
  },
];

const QUICK_REPLIES: Record<Lang, string[]> = {
  id: ["Bagaimana cara gabung APX?", "Apa syaratnya?", "Kapan jadwal war?", "Di mana lihat roster?"],
  en: ["How do I join APX?", "What are the requirements?", "When is the war schedule?", "Where can I see the roster?"],
};

const GREETING: Record<Lang, string> = {
  id: "Halo! 👋 Aku APX Bot. Tanya apa saja soal aliansi APX, atau klik salah satu pertanyaan di bawah.",
  en: "Hi! 👋 I'm APX Bot. Ask me anything about the APX alliance, or tap a question below.",
};

const FALLBACK: Record<Lang, string> = {
  id: "Maaf, aku belum paham pertanyaan itu. Coba klik salah satu pertanyaan di bawah, atau buka halaman FAQ.",
  en: "Sorry, I don't understand that question. Try one of the questions below, or open the FAQ page.",
};

function findRule(input: string): Rule | undefined {
  const q = input.toLowerCase();
  return RULES.find((rule) => rule.keywords.some((k) => q.includes(k)));
}

function getReply(input: string, lang: Lang): { text: string; links?: BotLink[] } {
  const rule = findRule(input);
  if (rule) {
    return { text: rule.text[lang], links: rule.links ? rule.links[lang] : undefined };
  }
  return {
    text: FALLBACK[lang],
    links: [{ label: lang === "id" ? "Buka FAQ" : "Open FAQ", href: "/faq" }],
  };
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDate(date: string, lang: Lang): string {
  const [y, m, d] = date.split("-");
  const month = monthNames[lang][Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

async function getNextEventText(lang: Lang): Promise<string> {
  try {
    const res = await fetch("/api/events");
    const json = await res.json();
    if (!json.ok || !Array.isArray(json.events)) throw new Error("no events");

    const today = localToday();
    const upcoming = (
      json.events as Array<{ title: string; event_date: string; event_time: string | null }>
    )
      .filter((e) => (e.event_date ?? "") >= today)
      .sort((a, b) =>
        `${a.event_date}T${a.event_time ?? "00:00"}`.localeCompare(
          `${b.event_date}T${b.event_time ?? "00:00"}`
        )
      );

    const next = upcoming[0];
    if (!next) {
      return lang === "id"
        ? "Belum ada jadwal event mendatang."
        : "No upcoming events scheduled.";
    }

    const date = formatDate(next.event_date, lang);
    const time = formatTimeZones(next.event_time);
    const timeLine = time ? `\n⏰ ${time}` : "";

    return lang === "id"
      ? `Event terdekat: ${next.title}\n📅 ${date}${timeLine}`
      : `Next event: ${next.title}\n📅 ${date}${timeLine}`;
  } catch {
    return lang === "id"
      ? "Maaf, gagal memuat jadwal event."
      : "Sorry, failed to load the event schedule.";
  }
}

export default function ChatBot({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ from: "bot", text: GREETING[lang] }]);
    }
  }, [open, messages.length, lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;

    setMessages((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTyping(true);

    setTimeout(async () => {
      const rule = findRule(clean);
      let replyText: string;
      let replyLinks: BotLink[] | undefined;

      if (rule?.dynamic === "next-event") {
        replyText = await getNextEventText(lang);
        replyLinks = rule.links ? rule.links[lang] : undefined;
      } else {
        const reply = getReply(clean, lang);
        replyText = reply.text;
        replyLinks = reply.links;
      }

      setMessages((m) => [...m, { from: "bot", text: replyText, links: replyLinks }]);
      setTyping(false);
    }, 450);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-emerald-500/10 sm:right-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 font-black text-zinc-950">
              APX
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100">APX Bot</p>
              <p className="text-xs text-emerald-400">● Online</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={lang === "id" ? "Tutup chat" : "Close chat"}
              className="ml-auto rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex max-h-80 min-h-[16rem] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.from === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-500 px-3.5 py-2 text-sm text-zinc-950"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-200"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Link
                          key={l.href + l.label}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                        >
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900 px-4 py-2.5">
                  <span className="animate-pulse text-sm text-zinc-400">...</span>
                </div>
              </div>
            )}

            {messages.length > 0 && !typing && (
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES[lang].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-400 hover:text-emerald-400"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "id" ? "Tulis pesan..." : "Type a message..."}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label={lang === "id" ? "Kirim" : "Send"}
              className="shrink-0 rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? (lang === "id" ? "Tutup chat" : "Close chat") : lang === "id" ? "Buka chat bot" : "Open chat bot"}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 sm:right-6"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-6 w-6">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
