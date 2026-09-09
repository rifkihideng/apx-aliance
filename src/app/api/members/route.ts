import { NextResponse } from "next/server";
import { dbAll, dbGet, dbRun, getSetting } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";

export async function GET() {
  const members = await dbAll(
    `SELECT id, ign, role, pangkat, level, discord, joined_at, active
     FROM members
     ORDER BY CASE role
       WHEN 'Ketua' THEN 1
       WHEN 'Wakil' THEN 2
       WHEN 'Pengurus' THEN 3
       ELSE 4
     END, level DESC`
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

  const ign = String(body.ign ?? "").trim();
  if (!ign) {
    return NextResponse.json({ ok: false, error: "In-game name (IGN) wajib diisi." }, { status: 400 });
  }

  const role = String(body.role ?? "Member").trim() || "Member";
  const pangkat = body.pangkat ? String(body.pangkat).trim() : null;
  const discord = body.discord ? String(body.discord).trim() : null;
  const joined_at = body.joined_at ? String(body.joined_at).trim() : null;
  const levelRaw = Number(body.level);
  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : null;

  const existingIgn = await dbGet("SELECT id FROM members WHERE lower(ign) = lower(?)", ign);
  if (existingIgn) {
    return NextResponse.json({ ok: false, error: "IGN sudah terdaftar." }, { status: 409 });
  }

  const info = await dbRun(
    "INSERT INTO members (ign, role, pangkat, level, discord, joined_at) VALUES (?, ?, ?, ?, ?, ?)",
    ign,
    role,
    pangkat,
    level,
    discord,
    joined_at
  );

  const waLink = await getSetting("wa_group_link");
  const welcome = waLink
    ? `Selamat datang ${ign} sebagai ${role} di APX Alliance!\nGabung grup WhatsApp: ${waLink}`
    : `Selamat datang ${ign} sebagai ${role} di APX Alliance!`;

  await dbRun("INSERT INTO announcements (title, content) VALUES (?, ?)", "Member Baru Bergabung 🎉", welcome);

  await sendPushToAll("Member Baru Bergabung 🎉", welcome, "/berita");

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
