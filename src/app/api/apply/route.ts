import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

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

  const ign = String(body.ign ?? "").trim();
  const discord = String(body.discord ?? "").trim();
  const alasan = String(body.alasan ?? "").trim();
  const levelRaw = Number(body.level);

  if (!ign) {
    return NextResponse.json({ ok: false, error: "In-game name (IGN) wajib diisi." }, { status: 400 });
  }
  if (!alasan) {
    return NextResponse.json({ ok: false, error: "Alasan bergabung wajib diisi." }, { status: 400 });
  }

  const level = Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : null;

  const info = await dbRun(
    "INSERT INTO applications (ign, level, discord, alasan) VALUES (?, ?, ?, ?)",
    ign,
    level,
    discord,
    alasan
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
