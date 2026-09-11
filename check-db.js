const { createClient } = require("@libsql/client");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function loadEnv(file) {
  const env = {};
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim();
  }
  return env;
}

(async () => {
  const env = loadEnv(path.join(process.cwd(), ".env.local"));
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  const db = url
    ? createClient({ url, authToken })
    : createClient({ url: pathToFileURL(path.join(process.cwd(), "data", "apx.db")).href });

  console.log("TARGET:", url ? "TURSO" : "LOCAL FILE");

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("TABLES:", tables.rows.map((r) => r.name).join(","));

  const members = await db.execute("PRAGMA table_info(members)");
  console.log("MEMBERS:", members.rows.map((r) => r.name).join(","));

  const events = await db.execute("PRAGMA table_info(events)");
  console.log("EVENTS:", events.rows.map((r) => r.name).join(","));

  const roles = await db.execute("SELECT * FROM roles ORDER BY id");
  console.log("ROLES:", JSON.stringify(roles.rows));

  const ranks = await db.execute("SELECT * FROM ranks ORDER BY id");
  console.log("RANKS:", JSON.stringify(ranks.rows));

  const types = await db.execute("SELECT * FROM event_types ORDER BY id");
  console.log("EVENT_TYPES:", JSON.stringify(types.rows));

  const idx = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
  );
  console.log("INDEXES:", idx.rows.map((r) => r.name).join(","));

  const cnt = await db.execute("SELECT COUNT(*) c FROM members");
  console.log("MEMBERS_COUNT:", cnt.rows[0].c);
})();
