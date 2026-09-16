import { NextResponse } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeDiscord, normalizeKey, normalizeText } from "@/lib/normalize";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  const checkins = await dbAll(
    "SELECT id, name, discord, created_at FROM event_checkins WHERE event_id = ? ORDER BY id ASC",
    id
  );

  return NextResponse.json({ ok: true, checkins });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = await rateLimit(`checkin:${ip}`, 5, 10 * 60 * 1000);
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

  // Honeypot: bot yang mengisi kolom tersembunyi di-drop diam-diam (dianggap sukses).
  const honeypot =
    typeof body.website === "string"
      ? body.website
      : typeof body.company === "string"
        ? body.company
        : "";
  if (honeypot.trim() !== "") {
    return NextResponse.json({ ok: true, id: 0 });
  }

  // Kiriman kilat (< 3 detik setelah form dimuat) dianggap bot.
  const submittedAt = typeof body.ts === "number" ? body.ts : NaN;
  const elapsed = Date.now() - submittedAt;
  if (!Number.isFinite(elapsed) || elapsed < 3000) {
    return NextResponse.json(
      { ok: false, error: "Terlalu cepat. Silakan isi formulir lalu coba lagi." },
      { status: 429 }
    );
  }

  const event = await dbGet("SELECT id FROM events WHERE id = ?", id);
  if (!event) {
    return NextResponse.json({ ok: false, error: "Event tidak ditemukan." }, { status: 404 });
  }

  const name = normalizeText(body.name);
  const discord = normalizeDiscord(body.discord);

  if (!name) {
    return NextResponse.json({ ok: false, error: "IGN / nama wajib diisi." }, { status: 400 });
  }

  const nameKey = normalizeKey(name);

  const existing = await dbGet(
    "SELECT id FROM event_checkins WHERE event_id = ? AND name_key = ? LIMIT 1",
    id,
    nameKey
  );
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Kamu sudah check-in untuk event ini." },
      { status: 409 }
    );
  }

  let info: { lastInsertRowid: number; changes: number };
  try {
    info = await dbRun(
      "INSERT INTO event_checkins (event_id, name, name_key, discord) VALUES (?, ?, ?, ?)",
      id,
      name,
      nameKey,
      discord
    );
  } catch (error) {
    // Jaga-jaga kalau dua request masuk bersamaan dan lolos pengecekan di atas.
    if (error instanceof Error && /unique/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: "Kamu sudah check-in untuk event ini." },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
