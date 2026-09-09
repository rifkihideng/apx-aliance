# APX Alliance — Narco Empire

Website aliansi **APX** untuk game **Narco Empire**.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **SQLite** via `better-sqlite3`

## Fitur

- Landing page dengan statistik aliansi (diambil dari SQLite)
- Halaman **Roster** member (server-rendered dari database)
- Formulir **Rekrutmen** yang menyimpan lamaran ke SQLite via API
- Halaman **Aturan** aliansi
- API endpoint: `GET /api/members`, `POST /api/apply`

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

## Database

Database SQLite tersimpan otomatis di folder `data/apx.db` dan di-seed dengan
member contoh saat pertama kali dijalankan. File `data/` sudah di-`.gitignore`.

Struktur tabel:
- `members` — daftar member (ign, role, pangkat, level, discord, joined_at, active)
- `applications` — lamaran masuk dari formulir rekrutmen
