import { NextResponse } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeMultiline, normalizeText } from "@/lib/normalize";
import { containsBadWords } from "@/lib/moderation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  const comments = await dbAll(
    "SELECT id, name, message, created_at FROM comments WHERE announcement_id = ? AND approved = 1 ORDER BY id ASC",
    id
  );

  return NextResponse.json({ ok: true, comments });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = await rateLimit(`comment:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Terlalu banyak komentar. Coba lagi beberapa menit lagi." },
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

  const post = await dbGet("SELECT id FROM announcements WHERE id = ?", id);
  if (!post) {
    return NextResponse.json({ ok: false, error: "Berita tidak ditemukan." }, { status: 404 });
  }

  const name = normalizeText(body.name);
  const message = normalizeMultiline(body.message);

  if (!name) {
    return NextResponse.json({ ok: false, error: "Nama wajib diisi." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: "Komentar wajib diisi." }, { status: 400 });
  }

  // Komentar kasar ditahan untuk moderasi (approved = 0), sisanya langsung tampil.
  const approved = containsBadWords(name, message) ? 0 : 1;

  const info = await dbRun(
    "INSERT INTO comments (announcement_id, name, message, approved) VALUES (?, ?, ?, ?)",
    id,
    name,
    message,
    approved
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid, pending: approved === 0 });
}
