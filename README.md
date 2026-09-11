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

Tabel yang dipakai:

- `members` — daftar member (ign, role, pangkat, level, discord, joined_at, active)
- `applications` — lamaran masuk dari formulir rekrutmen
- `announcements` — berita/pengumuman
- `events` — jadwal war & event
- `push_subscriptions` — subscription notifikasi push
- `settings` — pengaturan (misal link grup WhatsApp)

Database otomatis di-seed dengan data contoh saat pertama kali dijalankan.
Folder `data/` sudah di-`.gitignore`.

## Keamanan

- Semua endpoint admin (POST/PATCH/DELETE) dilindungi cek sesi admin
- Rate limit pada login & form rekrutmen & push subscribe
- Security headers (CSP, X-Frame-Options, HSTS, dsb.) di `next.config.ts`
- Input dirender lewat React (ter-escape otomatis, anti XSS)
