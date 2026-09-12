import { NextResponse } from "next/server";
import {
  dbAll,
  dbGet,
  dbRun,
  getRoleId,
  getRankId,
  getSetting,
  makeUniqueSlug,
  syncMemberDenormalized,
} from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";
import {
  normalizeDate,
  normalizeDiscord,
  normalizeKey,
  normalizeLevel,
  normalizeNullable,
  normalizeText,
} from "@/lib/normalize";

export async function GET() {
  // Jalur baca cepat (denormalisasi): v_members membaca kolom salinan
  // role_name/rank_name, jadi tidak ada JOIN sama sekali di sini.
  const members = await dbAll(
    `SELECT id, ign, role, pangkat, level, discord, joined_at, active
     FROM v_members
     ORDER BY role_order ASC, level DESC`
  );

  return NextResponse.json({ ok: true, members });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const ign = normalizeText(body.ign);
  if (!ign) {
    return NextResponse.json({ ok: false, error: "In-game name (IGN) wajib diisi." }, { status: 400 });
  }

  const role = normalizeText(body.role) || "Member";
  const pangkat = normalizeNullable(body.pangkat);
  const discord = normalizeDiscord(body.discord);
  const level = normalizeLevel(body.level);

  let joined_at: string | null = null;
  if (normalizeText(body.joined_at) !== "") {
    joined_at = normalizeDate(body.joined_at);
    if (!joined_at) {
      return NextResponse.json(
        { ok: false, error: "Tanggal bergabung tidak valid (format YYYY-MM-DD)." },
        { status: 400 }
      );
    }
  }

  // Duplikat dicek lewat bentuk kanonik: "IGN", "ign", dan " ign " dianggap sama.
  const ignKey = normalizeKey(ign);
  const existingIgn = await dbGet(
    "SELECT id FROM members WHERE ign_key = ? OR lower(ign) = ? LIMIT 1",
    ignKey,
    ignKey
  );
  if (existingIgn) {
    return NextResponse.json({ ok: false, error: "IGN sudah terdaftar." }, { status: 409 });
  }

  const roleId = await getRoleId(role);
  const rankId = pangkat ? await getRankId(pangkat) : null;

  const info = await dbRun(
    `INSERT INTO members (ign, ign_key, role_id, rank_id, level, discord, discord_key, joined_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    ign,
    ignKey,
    roleId,
    rankId,
    level,
    discord,
    discord ? normalizeKey(discord) : null,
    joined_at
  );

  // DENORMALISASI: salinan role_name/rank_name diisi dari tabel lookup.
  await syncMemberDenormalized(info.lastInsertRowid);

  const waLink = await getSetting("wa_group_link");
  const welcome = waLink
    ? `Selamat datang ${ign} sebagai ${role} di APX Alliance!\nGabung grup WhatsApp: ${waLink}`
    : `Selamat datang ${ign} sebagai ${role} di APX Alliance!`;

  const announcementTitle = "Member Baru Bergabung 🎉";
  const announcementSlug = await makeUniqueSlug("announcements", `${announcementTitle} ${ign}`);
  await dbRun(
    "INSERT INTO announcements (title, slug, content) VALUES (?, ?, ?)",
    announcementTitle,
    announcementSlug,
    welcome
  );

  await sendPushToAll(announcementTitle, welcome, "/berita");

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
