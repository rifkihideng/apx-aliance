import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
        throw new Error("TURSO_DATABASE_URL belum di-set di environment hosting (Netlify/Vercel).");
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

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ign TEXT NOT NULL,
    role TEXT NOT NULL,
    pangkat TEXT,
    level INTEGER,
    discord TEXT,
    joined_at TEXT,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ign TEXT NOT NULL,
    level INTEGER,
    discord TEXT,
    alasan TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'event',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
];

async function seedMembers(db: Client) {
  const countRows = await db.execute("SELECT COUNT(*) AS c FROM members");
  const count = Number(countRows.rows[0].c);
  if (count >= TOTAL_MEMBERS) return;

  const existingRows = await db.execute("SELECT ign FROM members");
  const existing = new Set(existingRows.rows.map((r) => String(r.ign)));

  const toInsert = buildSeedMembers().filter((m) => !existing.has(m.ign));
  if (toInsert.length === 0) return;

  await db.batch(
    toInsert.map((m) => ({
      sql: "INSERT INTO members (ign, role, pangkat, level, discord, joined_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [m.ign, m.role, m.pangkat, m.level, m.discord, m.joined_at],
    })),
    "write"
  );
}

async function seedExtras(db: Client) {
  const ann = await db.execute("SELECT COUNT(*) AS c FROM announcements");
  if (Number(ann.rows[0].c) === 0) {
    await db.batch(
      [
        {
          sql: "INSERT INTO announcements (title, content) VALUES (?, ?)",
          args: ["Selamat Datang di Website Baru APX", "Website resmi aliansi APX kini hadir dengan fitur roster, rekrutmen, dan jadwal event."],
        },
        {
          sql: "INSERT INTO announcements (title, content) VALUES (?, ?)",
          args: ["Rekrutmen Terbuka", "APX membuka rekrutmen member baru. Daftar lewat menu Rekrut."],
        },
      ],
      "write"
    );
  }

  const ev = await db.execute("SELECT COUNT(*) AS c FROM events");
  if (Number(ev.rows[0].c) === 0) {
    await db.batch(
      [
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type) VALUES (?, ?, ?, ?, ?)",
          args: ["War Wilayah Mingguan", "2026-09-14", "20:00", "Serangan terkoordinasi ke wilayah rival.", "perang"],
        },
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type) VALUES (?, ?, ?, ?, ?)",
          args: ["Rapat Pengurus", "2026-09-11", "19:30", "Koordinasi strategi antar pengurus.", "rapat"],
        },
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type) VALUES (?, ?, ?, ?, ?)",
          args: ["Event Ekonomi", "2026-09-18", "21:00", "Bantu produksi dan distribusi sesama member.", "event"],
        },
      ],
      "write"
    );
  }

  await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('wa_group_link', '')");
}

async function initDb(): Promise<void> {
  const db = getDb();
  await db.batch(SCHEMA, "write");
  await seedMembers(db);
  await seedExtras(db);
}

async function ensureDb(): Promise<void> {
  if (!globalForDb._apxInit) {
    globalForDb._apxInit = initDb();
  }
  await globalForDb._apxInit;
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  await ensureDb();
  const res = await getDb().execute({ sql, args: params as never[] });
  // libsql mengembalikan Row yang bersifat array-like; ubah ke objek biasa.
  return res.rows.map((r) => ({ ...r })) as unknown as T[];
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
  await ensureDb();
  const res = await getDb().execute({ sql, args: params as never[] });
  return { lastInsertRowid: Number(res.lastInsertRowid), changes: Number(res.rowsAffected) };
}

export async function getSetting(key: string): Promise<string> {
  const row = await dbGet<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await dbRun(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value
  );
}
