import { NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  normalizeDiscord,
  normalizeKey,
  normalizeLevel,
  normalizeMultiline,
  normalizeText,
} from "@/lib/normalize";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`apply:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 600) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const ign = normalizeText(body.ign);
  const discord = normalizeDiscord(body.discord);
  const alasan = normalizeMultiline(body.alasan);
  const level = normalizeLevel(body.level);

  if (!ign) {
    return NextResponse.json({ ok: false, error: "In-game name (IGN) wajib diisi." }, { status: 400 });
  }
  if (!alasan) {
    return NextResponse.json({ ok: false, error: "Alasan bergabung wajib diisi." }, { status: 400 });
  }

  // Bentuk kanonik: "IGN", "ign", " ign " dianggap sama oleh UNIQUE index.
  const ignKey = normalizeKey(ign);

  const pending = await dbGet(
    "SELECT id FROM applications WHERE ign_key = ? AND status = 'pending' LIMIT 1",
    ignKey
  );
  if (pending) {
    return NextResponse.json(
      { ok: false, error: "Kamu sudah punya lamaran yang sedang ditinjau." },
      { status: 409 }
    );
  }

  let info: { lastInsertRowid: number; changes: number };
  try {
    info = await dbRun(
      `INSERT INTO applications (ign, ign_key, level, discord, discord_key, alasan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ign,
      ignKey,
      level,
      discord,
      discord ? normalizeKey(discord) : null,
      alasan
    );
  } catch (error) {
    // Jaga-jaga kalau dua request masuk bersamaan dan lolos pengecekan di atas.
    if (error instanceof Error && /unique/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: "Kamu sudah punya lamaran yang sedang ditinjau." },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
