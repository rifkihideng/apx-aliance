# APX Alliance — Narco Empire

Website aliansi **APX** untuk game **Narco Empire**.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Turso** (SQLite cloud) via `@libsql/client`, dengan fallback file lokal saat development
- **Web Push Notification** via `web-push`
- **Vercel** untuk deployment

## Fitur

**Halaman publik (bilingual ID/EN):**
- Landing page dengan statistik aliansi + countdown event terdekat (lengkap dengan WIB/WITA/WIT/UTC)
- **Roster** member dengan pencarian & filter role
- Formulir **Rekrutmen** (tersimpan ke database)
- Halaman **Berita**, **Jadwal**, **Aturan**, dan **FAQ**
- Chatbot (APX Bot) yang menjawab pertanyaan umum + menampilkan event terdekat dari database
- Notifikasi push untuk pengumuman & event baru
- SEO dasar: `sitemap.xml`, `robots.txt`, Open Graph image, dan favicon

**Panel admin** (`/admin`):
- Login dengan password + rate limit & cookie httpOnly
- Kelola **Member**, **Berita**, **Jadwal** (CRUD)
- Terima/tolak **pendaftar** (otomatis jadi member + kirim link WhatsApp)
- Pengaturan **link grup WhatsApp**
- Kirim notifikasi push otomatis saat ada berita/event/member baru

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Build produksi:

```bash
npm run build
npm run start
```

## Environment Variables

Buat file `.env.local` (sudah di-`.gitignore`, jangan di-commit):

```bash
# Wajib di production — password untuk login panel admin
ADMIN_PASSWORD=

# Database Turso (wajib di production)
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=

# Kunci privat VAPID untuk web push (generate via `npx web-push generate-vapid-keys`)
VAPID_PRIVATE_KEY=

# Opsional — URL publik situs untuk sitemap/OG.
# Di Vercel bisa dikosongkan karena otomatis memakai VERCEL_PROJECT_PRODUCTION_URL,
# tapi disarankan di-set ke domain utama, mis. https://apx.example.com
NEXT_PUBLIC_SITE_URL=
```

Catatan: saat development, jika `TURSO_DATABASE_URL` kosong, aplikasi otomatis
memakai file SQLite lokal di `data/apx.db`.

## Deployment ke Vercel

1. Import repository ini di [vercel.com/new](https://vercel.com/new).
2. Vercel otomatis mendeteksi **Next.js** (tidak perlu setting build command).
3. Tambahkan environment variables berikut di **Project → Settings → Environment Variables**
   (scope: Production & Preview):

   | Variable | Nilai |
   | --- | --- |
   | `ADMIN_PASSWORD` | password admin |
   | `TURSO_DATABASE_URL` | `libsql://...` |
   | `TURSO_AUTH_TOKEN` | token Turso |
   | `VAPID_PRIVATE_KEY` | private key web push |
   | `NEXT_PUBLIC_SITE_URL` | `https://domain-kamu` (opsional) |

   > Vercel **tidak** menyediakan env `URL` seperti Netlify, jadi pastikan
   > `NEXT_PUBLIC_SITE_URL` diisi bila memakai domain kustom.

4. Deploy. Vercel akan menjalankan `next build` dan men-deploy function API
   otomatis — tidak butuh `@netlify/plugin-nextjs` lagi.

Catatan penting: filesystem Vercel bersifat read-only/ephemeral, jadi **wajib**
pakai Turso di production (fallback SQLite lokal hanya untuk development).

## Database

### Struktur (normalisasi)

- `roles`, `ranks`, `event_types` — tabel lookup. `members.role_id`,
  `members.rank_id`, dan `events.type_id` memakai foreign key, jadi nama role
  tidak diulang-ulang di setiap baris member
- `members` — roster (ign, role_id, rank_id, level, discord, joined_at, active)
- `applications` — lamaran masuk dari formulir rekrutmen
- `announcements` — berita/pengumuman
- `events` — jadwal war & event
- `push_subscriptions` — subscription notifikasi push
- `settings` — pengaturan (misal link grup WhatsApp)

### Normalisasi teks

Semua input dibersihkan lewat `src/lib/normalize.ts` sebelum disimpan: Unicode
disamakan (NFC), spasi berlebih & karakter tak terlihat dibuang, dan huruf
diseragamkan sesuai jenis datanya.

Setiap nilai yang harus unik punya kolom `*_key` (bentuk kanonik huruf kecil)
dengan UNIQUE index, sehingga "Ketua", "ketua", dan " KETUA " dijamin menjadi
satu baris saja:

| Tabel | Kolom kanonik | Fungsinya |
| --- | --- | --- |
| `roles` / `ranks` / `event_types` | `name_key` | mencegah role/pangkat/tipe kembar |
| `members` | `ign_key` | menolak IGN dobel (beda huruf besar/kecil pun ditolak) |
| `members` | `discord_key` | pencarian tanpa membedakan huruf besar/kecil |
| `applications` | `ign_key` | satu IGN hanya boleh punya satu lamaran `pending` |
| `announcements` / `events` | `slug` | URL ramah SEO: `judul`, `judul-2`, `judul-3`, ... |

Contoh pemakaian:

```ts
import {
  normalizeText,
  normalizeKey,
  normalizeDate,
  normalizeTime,
  normalizeUrl,
  slugify,
} from "@/lib/normalize";

normalizeText("  Ketua   APX  "); // "Ketua APX"
normalizeKey("  Ketua APX  ");    // "ketua apx"
normalizeDate("2026-02-31");      // null (tanggal tidak ada di kalender)
normalizeTime("20:00:00");        // "20:00"
slugify("War Wilayah!!");         // "war-wilayah"
```

### Denormalisasi (performa baca)

Kolom `members.role_name`, `members.rank_name`, dan `events.type_name` menyimpan
**salinan** nama dari tabel lookup supaya halaman yang paling sering dibuka bisa
dibaca tanpa JOIN:

- `v_members` — roster lengkap dengan `role_order` (Ketua → Wakil → Pengurus →
  Member) yang sudah dihitung di view
- `v_events` — jadwal lengkap dengan nama tipe event

Salinan ini tidak pernah basi: setiap penulisan memanggil
`syncMemberDenormalized()` / `syncEventDenormalized()`, dan saat aplikasi start
`resyncDenormalized()` menyegarkan seluruh baris sekaligus. Kalau nama role diubah
langsung di database (di luar aplikasi), panggil `resyncDenormalized()` atau
restart aplikasi.

Verifikasi hasil normalisasi & denormalisasi:

```bash
node check-db.js
```

`DENORM_BASI_MEMBERS` dan `DENORM_BASI_EVENTS` harus bernilai `0`.

Database otomatis dimigrasi & di-seed saat pertama kali dijalankan. Migrasinya
idempotent, jadi aman dijalankan berkali-kali di database yang sudah berisi data.
Folder `data/` sudah di-`.gitignore`.

## Keamanan

- Semua endpoint admin (POST/PATCH/DELETE) dilindungi cek sesi admin
- Rate limit pada login & form rekrutmen & push subscribe
- Security headers (CSP, X-Frame-Options, HSTS, dsb.) di `next.config.ts`
- Input dirender lewat React (ter-escape otomatis, anti XSS)
