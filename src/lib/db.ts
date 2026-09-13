import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  normalizeDiscord,
  normalizeKey,
  normalizeNullableMultiline,
  normalizeText,
  normalizeTime,
  slugify,
} from "./normalize";

const globalForDb = globalThis as unknown as {
  _apxDb?: Client;
  _apxInit?: Promise<void>;
};

type SeedMember = {
  ign: string;
  role: string;
  pangkat: string;
  level: number;
  discord: string;
  joined_at: string;
};

const TOTAL_MEMBERS = 100;

const CORE_MEMBERS: SeedMember[] = [
  { ign: "Munhee", role: "Ketua", pangkat: "R5", level: 25, discord: "apxraja", joined_at: "2026-08-04" },
  { ign: "syujhaaaa", role: "Wakil", pangkat: "R4", level: 26, discord: "apxvice", joined_at: "2026-08-04" },
  { ign: "Nemesis", role: "Pengurus", pangkat: "R4", level: 28, discord: "apxlawyer", joined_at: "2026-08-04" },
  { ign: "Zancaking", role: "Pengurus", pangkat: "R4", level: 25, discord: "apxsniper", joined_at: "2026-08-04" },
  { ign: "Apx.DrugLord", role: "Member", pangkat: "Caporegime", level: 210, discord: "apxdruglord", joined_at: "2024-03-02" },
  { ign: "Apx.Ghost", role: "Member", pangkat: "Soldato", level: 183, discord: "apxghost", joined_at: "2024-04-19" },
  { ign: "Apx.Nova", role: "Member", pangkat: "Soldato", level: 171, discord: "apxnova", joined_at: "2024-05-27" },
  { ign: "Apx.Falcon", role: "Member", pangkat: "Associate", level: 126, discord: "apxfalcon", joined_at: "2024-08-09" },
];

const EXTRA_NICKS = [
  "Shadow", "Viper", "Raptor", "Blaze", "Storm", "Frost", "Titan", "Venom",
  "Phantom", "Reaper", "Wolf", "Hawk", "Cobra", "Dragon", "Kraken", "Onyx",
  "Jaguar", "Scorpion", "Lynx", "Rebel", "Ace", "Mirage", "Vortex",
];

const RANK_ROTATION = ["Soldato", "Associate", "Caporegime"];

function buildSeedMembers(): SeedMember[] {
  const members: SeedMember[] = [...CORE_MEMBERS];

  const needed = TOTAL_MEMBERS - members.length;
  for (let i = 0; i < needed; i++) {
    const nick = EXTRA_NICKS[i % EXTRA_NICKS.length];
    const variant = Math.floor(i / EXTRA_NICKS.length) + 1;
    const month = String(1 + (i % 12)).padStart(2, "0");
    const day = String(1 + (i % 27)).padStart(2, "0");
    const year = i % 2 === 0 ? 2024 : 2025;

    members.push({
      ign: `Apx.${nick}${variant}`,
      role: "Member",
      pangkat: RANK_ROTATION[i % RANK_ROTATION.length],
      level: 80 + ((i * 7) % 170),
      discord: `apx${nick.toLowerCase()}${variant}`,
      joined_at: `${year}-${month}-${day}`,
    });
  }

  return members;
}

function getDb(): Client {
  if (!globalForDb._apxDb) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("TURSO_DATABASE_URL belum di-set di environment hosting (Vercel).");
      }
      // Local fallback (hanya development): pakai file SQLite lokal via protokol file: milik libsql.
      const dataDir = path.join(process.cwd(), "data");
      fs.mkdirSync(dataDir, { recursive: true });
      const finalUrl = pathToFileURL(path.join(dataDir, "apx.db")).href;
      globalForDb._apxDb = createClient({ url: finalUrl });
      return globalForDb._apxDb;
    }

    globalForDb._apxDb = createClient({ url, authToken });
  }
  return globalForDb._apxDb;
}

/**
 * Skema NORMALISASI:
 * - nilai enum (role, pangkat, tipe event) dipisah ke tabel lookup + foreign key
 * - setiap nilai teks punya kolom `*_key` (bentuk kanonik huruf kecil) yang
 *   diberi UNIQUE index, sehingga "Ketua", " ketua ", dan "KETUA" tidak bisa
 *   tersimpan sebagai dua baris berbeda
 *
 * Kolom `*_key` sengaja nullable di DDL (SQLite tidak bisa menambah kolom
 * NOT NULL ke tabel yang sudah ada), tetapi SELALU diisi oleh aplikasi dan
 * dijaga UNIQUE index — lihat `normalize.ts`.
 */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS ranks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ign TEXT NOT NULL,
    ign_key TEXT,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    role_name TEXT,
    rank_id INTEGER REFERENCES ranks(id),
    rank_name TEXT,
    level INTEGER,
    discord TEXT,
    discord_key TEXT,
    joined_at TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ign TEXT NOT NULL,
    ign_key TEXT,
    level INTEGER,
    discord TEXT,
    discord_key TEXT,
    alasan TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT,
    event_date TEXT NOT NULL,
    event_time TEXT,
    description TEXT,
    type_id INTEGER NOT NULL REFERENCES event_types(id),
    type_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  )`,
];

/**
 * Kolom yang ditambahkan lewat `ALTER TABLE ... ADD COLUMN`.
 * Dipakai untuk memigrasi database lama tanpa membangun ulang tabel.
 */
const EXTRA_COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "roles", column: "name_key", ddl: "TEXT" },
  { table: "roles", column: "created_at", ddl: "TEXT" },
  { table: "ranks", column: "name_key", ddl: "TEXT" },
  { table: "ranks", column: "created_at", ddl: "TEXT" },
  { table: "event_types", column: "name_key", ddl: "TEXT" },
  { table: "event_types", column: "created_at", ddl: "TEXT" },
  { table: "members", column: "ign_key", ddl: "TEXT" },
  { table: "members", column: "discord_key", ddl: "TEXT" },
  { table: "members", column: "role_name", ddl: "TEXT" },
  { table: "members", column: "rank_name", ddl: "TEXT" },
  { table: "members", column: "created_at", ddl: "TEXT" },
  { table: "members", column: "updated_at", ddl: "TEXT" },
  { table: "applications", column: "ign_key", ddl: "TEXT" },
  { table: "applications", column: "discord_key", ddl: "TEXT" },
  { table: "applications", column: "updated_at", ddl: "TEXT" },
  { table: "announcements", column: "slug", ddl: "TEXT" },
  { table: "announcements", column: "updated_at", ddl: "TEXT" },
  { table: "events", column: "slug", ddl: "TEXT" },
  { table: "events", column: "type_name", ddl: "TEXT" },
  { table: "events", column: "updated_at", ddl: "TEXT" },
  { table: "push_subscriptions", column: "updated_at", ddl: "TEXT" },
  { table: "settings", column: "updated_at", ddl: "TEXT" },
];

/** Tabel lookup beserta tabel yang mereferensikannya (untuk dedupe/merge). */
const LOOKUP_TABLES: { table: string; fkTable: string; fkColumn: string }[] = [
  { table: "roles", fkTable: "members", fkColumn: "role_id" },
  { table: "ranks", fkTable: "members", fkColumn: "rank_id" },
  { table: "event_types", fkTable: "events", fkColumn: "type_id" },
];


async function seedMembers(db: Client) {
  const countRows = await db.execute("SELECT COUNT(*) AS c FROM members");
  const count = Number(countRows.rows[0].c);
  if (count >= TOTAL_MEMBERS) return;

  const roleRows = await db.execute("SELECT id, name, name_key FROM roles");
  const roleId = new Map(
    roleRows.rows.map((r) => [String(r.name_key ?? normalizeKey(r.name)), { id: Number(r.id), name: String(r.name) }])
  );
  const rankRows = await db.execute("SELECT id, name, name_key FROM ranks");
  const rankId = new Map(
    rankRows.rows.map((r) => [String(r.name_key ?? normalizeKey(r.name)), { id: Number(r.id), name: String(r.name) }])
  );

  const existingRows = await db.execute("SELECT ign, ign_key FROM members");
  const existing = new Set(existingRows.rows.map((r) => String(r.ign_key ?? normalizeKey(r.ign))));

  const toInsert = buildSeedMembers().filter((m) => !existing.has(normalizeKey(m.ign)));
  if (toInsert.length === 0) return;

  const createdAt = new Date().toISOString();

  await db.batch(
    toInsert
      .map((m) => {
        const role = roleId.get(normalizeKey(m.role));
        if (!role) return null; // role belum tersedia, jangan paksa insert (role_id NOT NULL)
        const rank = m.pangkat ? rankId.get(normalizeKey(m.pangkat)) : undefined;
        const discord = normalizeDiscord(m.discord);

        return {
          sql: `INSERT INTO members
                  (ign, ign_key, role_id, role_name, rank_id, rank_name, level, discord, discord_key, joined_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            normalizeText(m.ign),
            normalizeKey(m.ign),
            role.id,
            role.name,
            rank?.id ?? null,
            rank?.name ?? null,
            m.level,
            discord,
            discord ? normalizeKey(discord) : null,
            m.joined_at,
            createdAt,
          ],
        };
      })
      .filter((stmt) => stmt !== null),
    "write"
  );
}

async function seedExtras(db: Client) {
  const ann = await db.execute("SELECT COUNT(*) AS c FROM announcements");
  if (Number(ann.rows[0].c) === 0) {
    const rows = [
      {
        title: "Selamat Datang di Website Baru APX",
        content: "Website resmi aliansi APX kini hadir dengan fitur roster, rekrutmen, dan jadwal event.",
      },
      {
        title: "Rekrutmen Terbuka",
        content: "APX membuka rekrutmen member baru. Daftar lewat menu Rekrut.",
      },
    ];

    await db.batch(
      rows.map((r) => ({
        sql: "INSERT INTO announcements (title, slug, content) VALUES (?, ?, ?)",
        args: [normalizeText(r.title), slugify(r.title), normalizeText(r.content)],
      })),
      "write"
    );
  }

  const ev = await db.execute("SELECT COUNT(*) AS c FROM events");
  if (Number(ev.rows[0].c) === 0) {
    const typeRows = await db.execute("SELECT id, name, name_key FROM event_types");
    const typeMap = new Map(
      typeRows.rows.map((r) => [
        String(r.name_key ?? normalizeKey(r.name)),
        { id: Number(r.id), name: String(r.name) },
      ])
    );

    const rows = [
      {
        title: "War Wilayah Mingguan",
        event_date: "2026-09-14",
        event_time: "20:00",
        description: "Serangan terkoordinasi ke wilayah rival.",
        type: "perang",
      },
      {
        title: "Rapat Pengurus",
        event_date: "2026-09-11",
        event_time: "19:30",
        description: "Koordinasi strategi antar pengurus.",
        type: "rapat",
      },
      {
        title: "Event Ekonomi",
        event_date: "2026-09-18",
        event_time: "21:00",
        description: "Bantu produksi dan distribusi sesama member.",
        type: "event",
      },
    ];

    await db.batch(
      rows
        .map((r) => {
          const type = typeMap.get(normalizeKey(r.type));
          if (!type) return null; // type_id NOT NULL
          return {
            sql: `INSERT INTO events
                    (title, slug, event_date, event_time, description, type_id, type_name)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              normalizeText(r.title),
              slugify(r.title),
              r.event_date,
              normalizeTime(r.event_time),
              normalizeNullableMultiline(r.description),
              type.id,
              type.name,
            ],
          };
        })
        .filter((stmt) => stmt !== null),
      "write"
    );
  }

  await db.execute(
    "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('wa_group_link', '', datetime('now', 'localtime'))"
  );
}

const DEFAULT_ROLES = ["Ketua", "Wakil", "Pengurus", "Member"];
const DEFAULT_RANKS = ["R5", "R4", "Caporegime", "Soldato", "Associate"];
const DEFAULT_EVENT_TYPES = ["event", "rapat", "perebutan", "perang"];

/**
 * Index untuk integritas (UNIQUE) + performa baca.
 *
 * UNIQUE pada kolom `*_key` membuat aturan "tidak boleh duplikat" berlaku di
 * level database — bukan hanya dicek di kode aplikasi — sehingga "Ketua",
 * " ketua ", dan "KETUA" tidak mungkin menjadi dua baris berbeda.
 */
const INDEXES = [
  // --- integritas: nilai kanonik unik ---
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_name_key ON roles(name_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_ranks_name_key ON ranks(name_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_event_types_name_key ON event_types(name_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_members_ign_key ON members(ign_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_announcements_slug ON announcements(slug)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_events_slug ON events(slug)`,
  // Anti-spam: satu IGN hanya boleh punya satu lamaran yang masih pending.
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_applications_pending_ign ON applications(ign_key) WHERE status = 'pending'`,

  // --- performa: filter & urut ---
  `CREATE INDEX IF NOT EXISTS idx_members_level ON members(level)`,
  `CREATE INDEX IF NOT EXISTS idx_members_active ON members(active)`,
  `CREATE INDEX IF NOT EXISTS idx_members_role_id ON members(role_id)`,
  `CREATE INDEX IF NOT EXISTS idx_members_rank_id ON members(rank_id)`,
  `CREATE INDEX IF NOT EXISTS idx_members_discord_key ON members(discord_key)`,
  `CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_events_type_id ON events(type_id)`,
  `CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`,
  `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint)`,
];

/**
 * DENORMALISASI.
 *
 * `members.role_name`, `members.rank_name`, dan `events.type_name` menyimpan
 * SALINAN nama dari tabel lookup supaya halaman yang paling sering dibuka
 * (roster & jadwal) bisa dibaca tanpa JOIN sama sekali.
 *
 * Salinan ini tidak boleh basi:
 * - setiap penulisan memanggil `syncMemberDenormalized` / `syncEventDenormalized`
 * - saat aplikasi start, `resyncDenormalized()` memperbaiki semua baris sekaligus
 *
 * View di bawah adalah "jalur baca cepat": satu SELECT datar, tanpa JOIN,
 * dan `role_order` sudah terhitung sehingga query di route jadi sederhana.
 * Kalau suatu saat nama role diubah langsung di database, panggil
 * `resyncDenormalized()` (atau restart aplikasi) untuk menyegarkan salinannya.
 */
const VIEWS = [
  `DROP VIEW IF EXISTS v_members`,
  `CREATE VIEW v_members AS
     SELECT m.id, m.ign, m.ign_key, m.role_id, m.role_name AS role,
            m.rank_id, m.rank_name AS pangkat, m.level, m.discord,
            m.joined_at, m.active, m.updated_at,
            CASE m.role_name
              WHEN 'Ketua' THEN 1
              WHEN 'Wakil' THEN 2
              WHEN 'Pengurus' THEN 3
              ELSE 4
            END AS role_order
     FROM members m`,
  `DROP VIEW IF EXISTS v_events`,
  `CREATE VIEW v_events AS
     SELECT e.id, e.title, e.slug, e.event_date, e.event_time, e.description,
            e.type_id, e.type_name AS type, e.created_at, e.updated_at
     FROM events e`,
];

async function tableExists(db: Client, name: string): Promise<boolean> {
  const res = await db.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [name],
  });
  return res.rows.length > 0;
}

async function columnExists(db: Client, table: string, column: string): Promise<boolean> {
  const res = await db.execute(`PRAGMA table_info(${table})`);
  for (const r of res.rows) {
    if (String(r.name) === column) return true;
  }
  return false;
}

async function migrate(db: Client): Promise<void> {
  // Pemulihan: kembalikan tabel sementara jika rebuild sebelumnya terputus.
  if (!(await tableExists(db, "members")) && (await tableExists(db, "members__new"))) {
    await db.execute("ALTER TABLE members__new RENAME TO members");
  }
  if (!(await tableExists(db, "events")) && (await tableExists(db, "events__new"))) {
    await db.execute("ALTER TABLE events__new RENAME TO events");
  }

  // Pindahkan nilai enum lama ke tabel lookup (hanya jika kolom lama masih ada).
  try {
    await db.execute({ sql: "INSERT OR IGNORE INTO roles (name) SELECT DISTINCT role FROM members WHERE role IS NOT NULL", args: [] });
  } catch { /* kolom role belum ada di skema baru */ }
  try {
    await db.execute({ sql: "INSERT OR IGNORE INTO ranks (name) SELECT DISTINCT pangkat FROM members WHERE pangkat IS NOT NULL", args: [] });
  } catch { /* kolom pangkat belum ada di skema baru */ }
  try {
    await db.execute({ sql: "INSERT OR IGNORE INTO event_types (name) SELECT DISTINCT type FROM events WHERE type IS NOT NULL", args: [] });
  } catch { /* kolom type belum ada di skema baru */ }

  // Pastikan nilai default tersedia.
  for (const name of DEFAULT_ROLES) {
    await db.execute({ sql: "INSERT OR IGNORE INTO roles (name) VALUES (?)", args: [name] });
  }
  for (const name of DEFAULT_RANKS) {
    await db.execute({ sql: "INSERT OR IGNORE INTO ranks (name) VALUES (?)", args: [name] });
  }
  for (const name of DEFAULT_EVENT_TYPES) {
    await db.execute({ sql: "INSERT OR IGNORE INTO event_types (name) VALUES (?)", args: [name] });
  }

  // Rebuild members: kolom role/pangkat -> role_id/rank_id.
  if (!(await columnExists(db, "members", "role_id"))) {
    await db.batch(
      [
        `DROP TABLE IF EXISTS members__new`,
        `CREATE TABLE members__new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ign TEXT NOT NULL,
          role_id INTEGER NOT NULL REFERENCES roles(id),
          rank_id INTEGER REFERENCES ranks(id),
          level INTEGER,
          discord TEXT,
          joined_at TEXT,
          active INTEGER NOT NULL DEFAULT 1
        )`,
        `INSERT INTO members__new (id, ign, role_id, rank_id, level, discord, joined_at, active)
         SELECT m.id, m.ign,
           COALESCE((SELECT id FROM roles WHERE name = m.role), (SELECT id FROM roles WHERE name = 'Member')),
           (SELECT id FROM ranks WHERE name = m.pangkat),
           m.level, m.discord, m.joined_at, m.active
         FROM members m`,
        `DROP TABLE members`,
        `ALTER TABLE members__new RENAME TO members`,
      ],
      "write"
    );
  }

  // Rebuild events: kolom type -> type_id.
  if (!(await columnExists(db, "events", "type_id"))) {
    await db.batch(
      [
        `DROP TABLE IF EXISTS events__new`,
        `CREATE TABLE events__new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          event_date TEXT NOT NULL,
          event_time TEXT,
          description TEXT,
          type_id INTEGER NOT NULL REFERENCES event_types(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )`,
        `INSERT INTO events__new (id, title, event_date, event_time, description, type_id, created_at)
         SELECT e.id, e.title, e.event_date, e.event_time, e.description,
           COALESCE((SELECT id FROM event_types WHERE name = e.type), (SELECT id FROM event_types WHERE name = 'event')),
           e.created_at
         FROM events e`,
        `DROP TABLE events`,
        `ALTER TABLE events__new RENAME TO events`,
      ],
      "write"
    );
  }
}

/** Tambahkan kolom baru ke tabel lama tanpa perlu membangun ulang tabel. */
async function addMissingColumns(db: Client): Promise<void> {
  for (const col of EXTRA_COLUMNS) {
    if (!(await columnExists(db, col.table, col.column))) {
      await db.execute(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.ddl}`);
    }
  }
}

/**
 * Rapikan nama di tabel lookup lalu isi `name_key`.
 * Nilai lama yang belum kanonik (mis. " Ketua ", "KETUA") dibetulkan di sini.
 */
async function backfillLookupKeys(db: Client): Promise<void> {
  for (const { table } of LOOKUP_TABLES) {
    const rows = await db.execute(`SELECT id, name, name_key, created_at FROM ${table}`);

    for (const row of rows.rows) {
      const id = Number(row.id);
      const name = normalizeText(row.name);
      const key = normalizeKey(row.name);
      if (!key) continue;

      if (String(row.name) !== name || String(row.name_key ?? "") !== key) {
        await db.execute({
          sql: `UPDATE ${table} SET name = ?, name_key = ? WHERE id = ?`,
          args: [name, key, id],
        });
      }
      if (row.created_at === null || row.created_at === undefined) {
        await db.execute({
          sql: `UPDATE ${table} SET created_at = datetime('now', 'localtime') WHERE id = ?`,
          args: [id],
        });
      }
    }
  }
}

/**
 * Gabungkan baris lookup yang ternyata sama setelah dinormalisasi
 * (mis. "Ketua" dan "KETUA"), lalu arahkan foreign key ke baris yang dipakai.
 * WAJIB dijalankan sebelum UNIQUE index dibuat, kalau tidak index akan gagal.
 */
async function dedupeLookups(db: Client): Promise<void> {
  for (const { table, fkTable, fkColumn } of LOOKUP_TABLES) {
    const rows = await db.execute(`SELECT id, name_key FROM ${table} ORDER BY id ASC`);
    const canonical = new Map<string, number>();
    const duplicates: { keepId: number; dupId: number }[] = [];

    for (const row of rows.rows) {
      const key = String(row.name_key ?? "");
      if (!key) continue;

      const id = Number(row.id);
      const keepId = canonical.get(key);
      if (keepId === undefined) canonical.set(key, id);
      else duplicates.push({ keepId, dupId: id });
    }

    for (const { keepId, dupId } of duplicates) {
      await db.execute({
        sql: `UPDATE ${fkTable} SET ${fkColumn} = ? WHERE ${fkColumn} = ?`,
        args: [keepId, dupId],
      });
      await db.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [dupId] });
    }
  }
}

/**
 * Isi `ign_key`/`discord_key` dan rapikan IGN/discord milik data lama.
 * Kalau setelah dinormalisasi ternyata ada dua baris kembar, baris kedua
 * dibiarkan tanpa key supaya migrasi tidak gagal — admin bisa membetulkan
 * lewat panel (pencarian duplikat tetap berjalan seperti sebelumnya).
 */
async function backfillMembers(db: Client): Promise<void> {
  const rows = await db.execute("SELECT id, ign, ign_key, discord, discord_key FROM members");

  for (const row of rows.rows) {
    const id = Number(row.id);
    const ign = normalizeText(row.ign);
    const ignKey = normalizeKey(row.ign);
    const discord = normalizeDiscord(row.discord);
    const discordKey = discord ? normalizeKey(discord) : null;

    const unchanged =
      String(row.ign) === ign &&
      String(row.ign_key ?? "") === ignKey &&
      String(row.discord ?? "") === String(discord ?? "") &&
      String(row.discord_key ?? "") === String(discordKey ?? "");
    if (unchanged) continue;

    try {
      await db.execute({
        sql: `UPDATE members
                 SET ign = ?, ign_key = ?, discord = ?, discord_key = ?,
                     updated_at = COALESCE(updated_at, datetime('now', 'localtime'))
               WHERE id = ?`,
        args: [ign, ignKey, discord, discordKey, id],
      });
    } catch (error) {
      console.warn(`[db] Lewati normalisasi member #${id}:`, error);
    }
  }
}

/** Isi slug untuk berita & jadwal lama yang belum punya slug. */
async function backfillSlugs(db: Client): Promise<void> {
  const targets: { table: "announcements" | "events"; fallback: string }[] = [
    { table: "announcements", fallback: "berita" },
    { table: "events", fallback: "event" },
  ];

  for (const { table, fallback } of targets) {
    const rows = await db.execute(
      `SELECT id, title FROM ${table} WHERE slug IS NULL OR slug = '' ORDER BY id ASC`
    );

    for (const row of rows.rows) {
      const id = Number(row.id);
      const slug = await uniqueSlugFor(db, table, String(row.title), fallback, id);

      try {
        await db.execute({ sql: `UPDATE ${table} SET slug = ? WHERE id = ?`, args: [slug, id] });
      } catch (error) {
        console.warn(`[db] Lewati slug ${table} #${id}:`, error);
      }
    }
  }
}

/**
 * Cari slug yang belum dipakai. `source` biasanya judul, `fallback` dipakai
 * kalau judulnya tidak menghasilkan slug sama sekali (mis. "???").
 */
async function uniqueSlugFor(
  db: Client,
  table: "announcements" | "events",
  source: string,
  fallback: string,
  excludeId?: number
): Promise<string> {
  const base = slugify(source) || fallback;
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const found = await db.execute({
      sql: excludeId
        ? `SELECT id FROM ${table} WHERE slug = ? AND id != ? LIMIT 1`
        : `SELECT id FROM ${table} WHERE slug = ? LIMIT 1`,
      args: excludeId ? [candidate, excludeId] : [candidate],
    });
    if (found.rows.length === 0) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

/**
 * DENORMALISASI: isi ulang salinan nama untuk seluruh baris sekaligus.
 * Idempotent — aman dijalankan berkali-kali, termasuk saat cold start.
 * Hanya dipanggil dari `initDb` (bukan lewat `ensureDb`) supaya tidak rekursif.
 */
async function syncAllDenormalized(db: Client): Promise<void> {
  await db.execute(`
    UPDATE members SET
      role_name = (SELECT r.name FROM roles r WHERE r.id = members.role_id),
      rank_name = (SELECT rk.name FROM ranks rk WHERE rk.id = members.rank_id)
  `);
  await db.execute(`
    UPDATE events SET
      type_name = (SELECT et.name FROM event_types et WHERE et.id = events.type_id)
  `);
}

async function initDb(): Promise<void> {
  const db = getDb();
  try {
    await db.execute("PRAGMA foreign_keys = ON");
  } catch {
    // Turso mungkin tidak mengaktifkan foreign_keys; FK tetap terdokumentasi di skema.
  }

  await db.batch(SCHEMA, "write"); // 1. buat tabel yang belum ada
  await migrate(db); // 2. konversi kolom enum lama (role/pangkat/type) -> foreign key
  await addMissingColumns(db); // 3. tambah kolom normalisasi & denormalisasi
  await backfillLookupKeys(db); // 4. rapikan nama lookup + isi name_key
  await dedupeLookups(db); // 5. gabungkan lookup kembar (butuh langkah 4)
  await backfillMembers(db); // 6. rapikan IGN/discord + isi kolom key
  await backfillSlugs(db); // 7. isi slug berita & jadwal
  await db.batch(INDEXES, "write"); // 8. UNIQUE + index performa
  await syncAllDenormalized(db); // 9. isi kolom salinan (denormalisasi)
  await db.batch(VIEWS, "write"); // 10. view jalur baca cepat
  await seedMembers(db); // 11. data contoh
  await seedExtras(db);
}

const DB_RETRY_ATTEMPTS = 3;

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = (error as Error & { cause?: unknown }).cause;
  const text = `${error.message} ${cause instanceof Error ? cause.message : ""}`.toLowerCase();
  return (
    text.includes("fetch failed") ||
    text.includes("timeout") ||
    text.includes("connection") ||
    text.includes("econnrefused") ||
    text.includes("enetunreach")
  );
}

async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < DB_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isConnectionError(error) || attempt === DB_RETRY_ATTEMPTS - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function ensureDb(): Promise<void> {
  if (!globalForDb._apxInit) {
    globalForDb._apxInit = initDb().catch((error) => {
      // Jangan simpan init yang gagal, supaya request berikutnya mencoba ulang.
      globalForDb._apxInit = undefined;
      throw error;
    });
  }
  await globalForDb._apxInit;
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  return withDbRetry(async () => {
    await ensureDb();
    const res = await getDb().execute({ sql, args: params as never[] });
    // libsql mengembalikan Row yang bersifat array-like; ubah ke objek biasa.
    return res.rows.map((r) => ({ ...r })) as unknown as T[];
  });
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | undefined> {
  const rows = await dbAll<T>(sql, ...params);
  return rows[0];
}

export async function dbRun(
  sql: string,
  ...params: unknown[]
): Promise<{ lastInsertRowid: number; changes: number }> {
  return withDbRetry(async () => {
    await ensureDb();
    const res = await getDb().execute({ sql, args: params as never[] });
    return { lastInsertRowid: Number(res.lastInsertRowid), changes: Number(res.rowsAffected) };
  });
}

/**
 * Cari id lookup berdasarkan bentuk kanonik (`name_key`), bukan teks mentah.
 * Dengan begitu "Ketua", "ketua", dan " KETUA " menunjuk ke baris yang sama,
 * dan UNIQUE index di kolom key menjamin tidak ada baris kembar.
 */
async function lookupId(table: "roles" | "ranks" | "event_types", name: string): Promise<number> {
  const display = normalizeText(name);
  const key = normalizeKey(name);
  if (!key) throw new Error(`Nama untuk ${table} tidak boleh kosong.`);

  return withDbRetry(async () => {
    await ensureDb();
    const db = getDb();

    const existing = await db.execute({
      sql: `SELECT id, name_key FROM ${table} WHERE name_key = ? OR lower(name) = ? LIMIT 1`,
      args: [key, key],
    });
    const row = existing.rows[0];
    if (row) {
      // Lengkapi name_key milik baris lama yang belum sempat dinormalisasi.
      if (String(row.name_key ?? "") !== key) {
        await db.execute({
          sql: `UPDATE ${table} SET name_key = ? WHERE id = ?`,
          args: [key, Number(row.id)],
        });
      }
      return Number(row.id);
    }

    const inserted = await db.execute({
      sql: `INSERT OR IGNORE INTO ${table} (name, name_key, created_at)
            VALUES (?, ?, datetime('now', 'localtime'))`,
      args: [display, key],
    });
    if (Number(inserted.lastInsertRowid) > 0) return Number(inserted.lastInsertRowid);

    const after = await db.execute({
      sql: `SELECT id FROM ${table} WHERE name_key = ? LIMIT 1`,
      args: [key],
    });
    return Number(after.rows[0].id);
  });
}

/**
 * DENORMALISASI: segarkan salinan `role_name`/`rank_name` untuk satu member.
 * Dipanggil setiap kali member ditulis, sehingga roster bisa dibaca tanpa JOIN
 * dan salinannya tidak pernah basi.
 */
export async function syncMemberDenormalized(id: number | string): Promise<void> {
  await dbRun(
    `UPDATE members SET
       role_name = (SELECT r.name FROM roles r WHERE r.id = members.role_id),
       rank_name = (SELECT rk.name FROM ranks rk WHERE rk.id = members.rank_id)
     WHERE id = ?`,
    id
  );
}

/** DENORMALISASI: segarkan salinan `type_name` untuk satu jadwal. */
export async function syncEventDenormalized(id: number | string): Promise<void> {
  await dbRun(
    `UPDATE events SET
       type_name = (SELECT et.name FROM event_types et WHERE et.id = events.type_id)
     WHERE id = ?`,
    id
  );
}

/**
 * Segarkan semua kolom salinan sekaligus. Pakai ini kalau nama role/pangkat/tipe
 * diubah langsung di database (di luar aplikasi).
 */
export async function resyncDenormalized(): Promise<void> {
  await withDbRetry(async () => {
    await ensureDb();
    await syncAllDenormalized(getDb());
  });
}

/**
 * Buat slug unik dari judul, dipakai route berita & jadwal supaya judul yang
 * sama tidak menabrak UNIQUE index: otomatis menjadi "judul-2", "judul-3", dst.
 */
export async function makeUniqueSlug(
  table: "announcements" | "events",
  source: unknown,
  excludeId?: number | string
): Promise<string> {
  return withDbRetry(async () => {
    await ensureDb();
    return uniqueSlugFor(
      getDb(),
      table,
      normalizeText(source),
      table === "events" ? "event" : "berita",
      excludeId === undefined ? undefined : Number(excludeId)
    );
  });
}

export function getRoleId(name: string): Promise<number> {
  return lookupId("roles", name);
}

export function getRankId(name: string): Promise<number> {
  return lookupId("ranks", name);
}

export function getEventTypeId(name: string): Promise<number> {
  return lookupId("event_types", name);
}

export async function getSetting(key: string): Promise<string> {
  const row = await dbGet<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await dbRun(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now', 'localtime'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value
  );
}
