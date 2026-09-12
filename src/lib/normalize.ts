/**
 * Utilitas normalisasi teks.
 *
 * Dipakai untuk membersihkan SEMUA input yang masuk ke database supaya:
 * - tidak ada spasi ganda / spasi di ujung (trim + collapse)
 * - karakter Unicode disamakan bentuknya (NFC) sehingga "é" hasil copy-paste
 *   berbeda tidak tersimpan sebagai dua nilai berbeda
 * - karakter tak terlihat (zero-width) dibuang, mencegah IGN "palsu" yang
 *   terlihat sama tapi sebenarnya berbeda (dipakai untuk bypass UNIQUE)
 *
 * `*_key` adalah bentuk kanonik (huruf kecil) yang dipakai untuk UNIQUE index
 * dan pencarian, sedangkan nilai asli tetap disimpan untuk ditampilkan.
 */

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g; // termasuk newline & tab

/** Normalisasi umum: NFC, buang karakter tak terlihat, rapikan spasi. */
export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFC")
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bentuk kanonik (huruf kecil) untuk UNIQUE index & lookup. */
export function normalizeKey(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

/** Normalisasi untuk kolom opsional: string kosong menjadi `null`. */
export function normalizeNullable(value: unknown): string | null {
  const text = normalizeText(value);
  return text.length > 0 ? text : null;
}

/**
 * Normalisasi teks multi-baris (berita, deskripsi).
 * Spasi dirapikan, tapi baris baru dipertahankan.
 */
export function normalizeMultiline(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFC")
    .replace(ZERO_WIDTH, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ") // spasi/tab berlebih, newline tetap
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeNullableMultiline(value: unknown): string | null {
  const text = normalizeMultiline(value);
  return text.length > 0 ? text : null;
}

/**
 * Discord username: Discord tidak membedakan huruf besar/kecil, jadi
 * disimpan huruf kecil semua. `@` di depan dan URL profil juga dibersihkan.
 */
export function normalizeDiscord(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const withoutUrl = text
    .replace(/^https?:\/\/(www\.)?(discord\.(gg|com)\/)?/i, "")
    .replace(/^@/, "");

  const cleaned = normalizeText(withoutUrl).toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Slug untuk URL: huruf kecil, aksen dibuang, hanya a-z/0-9 dipisah tanda hubung.
 * Contoh: "  Jadwal War Wilayah!! " -> "jadwal-war-wilayah"
 */
export function slugify(value: unknown): string {
  const text = normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "") // buang diakritik
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return text;
}

/** URL: wajib http(s), protokol & host diseragamkan, tanpa spasi. */
export function normalizeUrl(value: unknown): string | null {
  const text = normalizeText(value).replace(/\s+/g, "");
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  url.protocol = "https:";
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  // Buang trailing slash berlebih supaya "https://x.com/" == "https://x.com".
  const normalized = url.toString();
  return normalized.endsWith("/") && url.pathname === "/"
    ? normalized.slice(0, -1)
    : normalized;
}

/** Tanggal `YYYY-MM-DD` yang benar-benar ada di kalender, atau `null`. */
export function normalizeDate(value: unknown): string | null {
  const text = normalizeText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;

  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));

  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return valid ? `${y}-${m}-${d}` : null;
}

/** Jam `HH:MM` (24 jam). Menerima `HH:MM:SS` dan memotong detiknya. */
export function normalizeTime(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(text);
  if (!match) return null;

  return `${match[1]}:${match[2]}`;
}

/** Level: bilangan bulat positif, selain itu `null`. */
export function normalizeLevel(value: unknown): number | null {
  const raw = Number(normalizeText(value));
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.min(Math.floor(raw), 9999);
}

/** Status lamaran rekrutmen yang valid. */
export const APPLICATION_STATUSES = ["pending", "diterima", "ditolak"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function normalizeApplicationStatus(value: unknown): ApplicationStatus | null {
  const key = normalizeKey(value);
  return (APPLICATION_STATUSES as readonly string[]).includes(key)
    ? (key as ApplicationStatus)
    : null;
}
