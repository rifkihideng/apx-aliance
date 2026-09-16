/**
 * Filter moderasi komentar sederhana.
 *
 * Mendeteksi kata kasar/penghinaan supaya komentar seperti itu masuk antrean
 * moderasi, sedangkan komentar biasa langsung ditampilkan (auto-approve).
 *
 * Pendekatan: teks dinormalisasi (huruf kecil, tanpa aksen, substitusi karakter
 * umum "4" -> "a", "@" -> "a"), lalu dipecah menjadi token (kata utuh). Setiap
 * token dicocokkan baik dalam bentuk asli maupun bentuk "dirapatkan" (huruf
 * berulang dibuang: "anjiiing" -> "anjing"). Pencocokan per-token mencegah kata
 * pendek menandai kata biasa, mis. "cukup" tidak ditandai.
 */

const SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "@": "a",
  "!": "i",
  "$": "s",
  "+": "t",
};

const BAD_WORDS = new Set([
  // Indonesia
  "anjing", "anjg", "anjir", "anjay", "anying", "anjink", "anj",
  "bangsat", "bangsad", "bngst", "bgsd",
  "bajingan", "bajing",
  "kontol", "kntl", "kontl", "koncol",
  "memek", "mmk", "meki", "memeq",
  "pepek", "pepeq", "itil",
  "ngentot", "ngentod", "entot", "ngentd", "entd",
  "jancok", "jancuk", "jncok",
  "taik", "tai", "asu", "kirik",
  "tolol", "goblok", "goblog", "gblk", "bego", "begok",
  "brengsek", "kampret",
  "lonte", "pelacur", "perek", "jablay", "bencong", "banci",
  // Inggris
  "fuck", "fck", "fuk", "shit", "bitch", "asshole", "ass",
  "bastard", "dick", "pussy", "whore", "slut", "motherfucker",
  "fucker", "dumbass", "nigga", "nigger", "stupid", "idiot",
]);

function tokenize(value: unknown): string[] {
  const text = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // buang diakritik
    .toLowerCase()
    .split("")
    .map((ch) => SUBSTITUTIONS[ch] ?? ch)
    .join("")
    .replace(/[^a-z]+/g, " ") // non-huruf jadi pemisah kata
    .trim();

  return text ? text.split(/\s+/) : [];
}

/** Buang huruf berulang: "anjiiing" -> "anjing". */
function collapse(token: string): string {
  return token.replace(/(.)\1+/g, "$1");
}

export function containsBadWords(...values: unknown[]): boolean {
  for (const value of values) {
    const tokens = tokenize(value);
    if (tokens.some((token) => BAD_WORDS.has(token) || BAD_WORDS.has(collapse(token)))) {
      return true;
    }
  }
  return false;
}
