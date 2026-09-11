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

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS ranks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS event_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ign TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    rank_id INTEGER REFERENCES ranks(id),
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
    type_id INTEGER NOT NULL REFERENCES event_types(id),
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

  const roleRows = await db.execute("SELECT id, name FROM roles");
  const roleId = new Map(roleRows.rows.map((r) => [String(r.name), Number(r.id)]));
  const rankRows = await db.execute("SELECT id, name FROM ranks");
  const rankId = new Map(rankRows.rows.map((r) => [String(r.name), Number(r.id)]));

  const existingRows = await db.execute("SELECT ign FROM members");
  const existing = new Set(existingRows.rows.map((r) => String(r.ign)));

  const toInsert = buildSeedMembers().filter((m) => !existing.has(m.ign));
  if (toInsert.length === 0) return;

  await db.batch(
    toInsert.map((m) => ({
      sql: "INSERT INTO members (ign, role_id, rank_id, level, discord, joined_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [
        m.ign,
        roleId.get(m.role) ?? null,
        m.pangkat ? rankId.get(m.pangkat) ?? null : null,
        m.level,
        m.discord,
        m.joined_at,
      ],
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
    const typeRows = await db.execute("SELECT id, name FROM event_types");
    const typeId = new Map(typeRows.rows.map((r) => [String(r.name), Number(r.id)]));

    await db.batch(
      [
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type_id) VALUES (?, ?, ?, ?, ?)",
          args: ["War Wilayah Mingguan", "2026-09-14", "20:00", "Serangan terkoordinasi ke wilayah rival.", typeId.get("perang") ?? null],
        },
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type_id) VALUES (?, ?, ?, ?, ?)",
          args: ["Rapat Pengurus", "2026-09-11", "19:30", "Koordinasi strategi antar pengurus.", typeId.get("rapat") ?? null],
        },
        {
          sql: "INSERT INTO events (title, event_date, event_time, description, type_id) VALUES (?, ?, ?, ?, ?)",
          args: ["Event Ekonomi", "2026-09-18", "21:00", "Bantu produksi dan distribusi sesama member.", typeId.get("event") ?? null],
        },
      ],
      "write"
    );
  }

  await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('wa_group_link', '')");
}

const DEFAULT_ROLES = ["Ketua", "Wakil", "Pengurus", "Member"];
const DEFAULT_RANKS = ["R5", "R4", "Caporegime", "Soldato", "Associate"];
const DEFAULT_EVENT_TYPES = ["event", "rapat", "perebutan", "perang"];

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_members_level ON members(level)`,
  `CREATE INDEX IF NOT EXISTS idx_members_active ON members(active)`,
  `CREATE INDEX IF NOT EXISTS idx_members_role_id ON members(role_id)`,
  `CREATE INDEX IF NOT EXISTS idx_members_rank_id ON members(rank_id)`,
  `CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_events_type_id ON events(type_id)`,
  `CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`,
  `CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at)`,
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

async function initDb(): Promise<void> {
  const db = getDb();
  try {
    await db.execute("PRAGMA foreign_keys = ON");
  } catch {
    // Turso mungkin tidak mengaktifkan foreign_keys; FK tetap terdokumentasi di skema.
  }
  await db.batch(SCHEMA, "write");
  await migrate(db);
  await db.batch(INDEXES, "write");
  await seedMembers(db);
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

async function lookupId(table: "roles" | "ranks" | "event_types", name: string): Promise<number> {
  return withDbRetry(async () => {
    await ensureDb();
    const db = getDb();
    const existing = await db.execute({ sql: `SELECT id FROM ${table} WHERE name = ?`, args: [name] });
    const row = existing.rows[0];
    if (row) return Number(row.id);
    const inserted = await db.execute({ sql: `INSERT OR IGNORE INTO ${table} (name) VALUES (?)`, args: [name] });
    if (Number(inserted.lastInsertRowid) > 0) return Number(inserted.lastInsertRowid);
    const after = await db.execute({ sql: `SELECT id FROM ${table} WHERE name = ?`, args: [name] });
    return Number(after.rows[0].id);
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
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value
  );
}
