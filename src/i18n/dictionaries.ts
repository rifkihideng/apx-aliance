export type Lang = "id" | "en";

type Dict = Record<string, string>;

export const dictionaries: Record<Lang, Dict> = {
  id: {
    "nav.home": "Beranda",
    "nav.roster": "Roster",
    "nav.rekrut": "Rekrut",
    "nav.berita": "Berita",
    "nav.jadwal": "Jadwal",
    "nav.aturan": "Aturan",
    "nav.admin": "Admin",
    "nav.join": "Gabung Sekarang",
    "nav.openMenu": "Buka menu",

    "footer.disclaimer": "Website aliansi ini tidak berafiliasi resmi dengan pengembang game.",

    "home.tagline": "Narco Empire — Aliansi",
    "home.subtitle":
      "Bangun kekaisaran, kuasai wilayah, dan taklukkan rival. APX adalah aliansi elit di Narco Empire yang menjunjung solidaritas, strategi, dan dominasi.",
    "home.join": "Gabung APX",
    "home.roster": "Lihat Roster",
    "home.totalMember": "Total Member",
    "home.activeMember": "Member Aktif",
    "home.server": "Server",
    "home.why": "Kenapa Gabung APX?",
    "home.f1.title": "Strategi & Intelijen",
    "home.f1.desc": "Koordinasi perang dan intelijen wilayah secara terorganisir.",
    "home.f2.title": "Ekonomi Kuat",
    "home.f2.desc": "Jaringan produksi dan distribusi yang saling mendukung antar member.",
    "home.f3.title": "Komunitas Solid",
    "home.f3.desc": "Komunikasi aktif via Discord dengan suasana kekeluargaan.",

    "rules.title": "Aturan Aliansi",
    "rules.subtitle": "Ketentuan yang wajib dipatuhi seluruh member APX.",
    "rules.1.title": "Aktif Setiap Hari",
    "rules.1.desc": "Member wajib aktif log in harian dan mengikuti event serta tugas aliansi.",
    "rules.2.title": "Saling Membantu",
    "rules.2.desc": "Dukung ekonomi, pertahanan, dan produksi sesama member.",
    "rules.3.title": "Tidak Menyerang Sesama",
    "rules.3.desc": "Dilarang keras menyerang, menjarah, atau mencuri dari member APX.",
    "rules.4.title": "Ikut Koordinasi",
    "rules.4.desc": "Wajib bergabung di server Discord dan mengikuti arahan pengurus.",
    "rules.5.title": "Hormati Sesama",
    "rules.5.desc": "Jaga etika komunikasi, baik internal maupun dengan aliansi lain.",
    "rules.6.title": "Sanksi Bertingkat",
    "rules.6.desc": "Pelanggaran dikenai peringatan, penurunan pangkat, hingga pengeluaran.",

    "recruit.title": "Gabung APX",
    "recruit.subtitle": "Isi formulir di bawah untuk mendaftar sebagai member aliansi APX.",
    "form.ign": "In-game Name (IGN)",
    "form.level": "Level",
    "form.discord": "Discord",
    "form.alasan": "Alasan Bergabung",
    "form.ignPh": "Contoh: Apx.Nova",
    "form.levelPh": "Contoh: 150",
    "form.discordPh": "Contoh: apxnova",
    "form.alasanPh": "Ceritakan singkat kenapa kamu mau gabung APX...",
    "form.submit": "Kirim Pendaftaran",
    "form.sending": "Mengirim...",
    "form.success": "Pendaftaran terkirim! 🎉",
    "form.successDesc": "Tim rekrutmen APX akan menghubungimu lewat Discord.",

    "roster.title": "Roster Member",
    "roster.subtitle": "Daftar member aliansi APX di Narco Empire.",
    "roster.search": "Cari nama atau pangkat...",
    "roster.allRoles": "Semua Role",
    "roster.showing": "Menampilkan {a} dari {b} member.",
    "roster.none": "Tidak ada member yang cocok.",
    "roster.pangkat": "Pangkat",
    "roster.level": "Level",
    "roster.discord": "Discord",
    "roster.joined": "Bergabung",

    "news.title": "Berita & Pengumuman",
    "news.subtitle": "Informasi terbaru dari aliansi APX.",
    "news.empty": "Belum ada pengumuman.",

    "schedule.title": "Jadwal War & Event",
    "schedule.subtitle": "Jadwal kegiatan aliansi APX.",
    "schedule.empty": "Belum ada jadwal.",
    "event.badge.perang": "PERANG",
    "event.badge.perebutan": "PEREBUTAN",
  },
  en: {
    "nav.home": "Home",
    "nav.roster": "Roster",
    "nav.rekrut": "Recruit",
    "nav.berita": "News",
    "nav.jadwal": "Schedule",
    "nav.aturan": "Rules",
    "nav.admin": "Admin",
    "nav.join": "Join Now",
    "nav.openMenu": "Open menu",

    "footer.disclaimer": "This alliance website is not officially affiliated with the game developer.",

    "home.tagline": "Narco Empire — Alliance",
    "home.subtitle":
      "Build your empire, control territories, and conquer rivals. APX is an elite alliance in Narco Empire that upholds solidarity, strategy, and dominance.",
    "home.join": "Join APX",
    "home.roster": "View Roster",
    "home.totalMember": "Total Members",
    "home.activeMember": "Active Members",
    "home.server": "Server",
    "home.why": "Why Join APX?",
    "home.f1.title": "Strategy & Intel",
    "home.f1.desc": "Organized war coordination and territorial intelligence.",
    "home.f2.title": "Strong Economy",
    "home.f2.desc": "A production and distribution network that supports each member.",
    "home.f3.title": "Solid Community",
    "home.f3.desc": "Active communication via Discord with a family atmosphere.",

    "rules.title": "Alliance Rules",
    "rules.subtitle": "Rules that every APX member must follow.",
    "rules.1.title": "Active Every Day",
    "rules.1.desc": "Members must log in daily and participate in events and alliance tasks.",
    "rules.2.title": "Help Each Other",
    "rules.2.desc": "Support the economy, defense, and production of fellow members.",
    "rules.3.title": "Do Not Attack Each Other",
    "rules.3.desc": "Strictly forbidden to attack, raid, or steal from APX members.",
    "rules.4.title": "Follow Coordination",
    "rules.4.desc": "Must join the Discord server and follow the leaders' directions.",
    "rules.5.title": "Respect Each Other",
    "rules.5.desc": "Maintain communication ethics, both internally and with other alliances.",
    "rules.6.title": "Tiered Sanctions",
    "rules.6.desc": "Violations result in warnings, rank demotion, or removal.",

    "recruit.title": "Join APX",
    "recruit.subtitle": "Fill in the form below to register as a member of the APX alliance.",
    "form.ign": "In-game Name (IGN)",
    "form.level": "Level",
    "form.discord": "Discord",
    "form.alasan": "Reason to Join",
    "form.ignPh": "e.g. Apx.Nova",
    "form.levelPh": "e.g. 150",
    "form.discordPh": "e.g. apxnova",
    "form.alasanPh": "Briefly tell us why you want to join APX...",
    "form.submit": "Submit Application",
    "form.sending": "Sending...",
    "form.success": "Application submitted! 🎉",
    "form.successDesc": "The APX recruitment team will contact you via Discord.",

    "roster.title": "Roster",
    "roster.subtitle": "List of APX alliance members in Narco Empire.",
    "roster.search": "Search name or rank...",
    "roster.allRoles": "All Roles",
    "roster.showing": "Showing {a} of {b} members.",
    "roster.none": "No matching members.",
    "roster.pangkat": "Rank",
    "roster.level": "Level",
    "roster.discord": "Discord",
    "roster.joined": "Joined",

    "news.title": "News & Announcements",
    "news.subtitle": "Latest information from the APX alliance.",
    "news.empty": "No announcements yet.",

    "schedule.title": "War & Event Schedule",
    "schedule.subtitle": "APX alliance activity schedule.",
    "schedule.empty": "No schedule yet.",
    "event.badge.perang": "WAR",
    "event.badge.perebutan": "CAPTURE",
  },
};

export const monthNames: Record<Lang, string[]> = {
  id: [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

export function translate(
  lang: Lang | undefined | null,
  key: string,
  vars?: Record<string, string | number>
): string {
  const l: Lang = lang === "en" ? "en" : "id";
  let s = dictionaries[l][key] ?? dictionaries.id[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}
