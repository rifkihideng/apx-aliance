import { NextResponse } from "next/server";
import {
  dbAll,
  dbRun,
  getEventTypeId,
  makeUniqueSlug,
  syncEventDenormalized,
} from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";
import {
  normalizeDate,
  normalizeKey,
  normalizeNullableMultiline,
  normalizeText,
  normalizeTime,
} from "@/lib/normalize";

export async function GET() {
  // Jalur baca cepat (denormalisasi): v_events sudah memuat `type_name`,
  // jadi tidak perlu JOIN ke event_types lagi.
  const events = await dbAll(
    "SELECT id, title, slug, event_date, event_time, description, type, created_at FROM v_events ORDER BY event_date ASC, id DESC"
  );
  return NextResponse.json({ ok: true, events });
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

  const title = normalizeText(body.title);
  const type = normalizeText(body.type) || "event";
  const description = normalizeNullableMultiline(body.description);

  if (!title) {
    return NextResponse.json({ ok: false, error: "Judul wajib diisi." }, { status: 400 });
  }

  const event_date = normalizeDate(body.event_date);
  if (!event_date) {
    return NextResponse.json(
      { ok: false, error: "Tanggal wajib diisi dengan format YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const event_time = normalizeTime(body.event_time);
  if (normalizeText(body.event_time) !== "" && !event_time) {
    return NextResponse.json(
      { ok: false, error: "Jam tidak valid (format HH:MM)." },
      { status: 400 }
    );
  }

  const typeId = await getEventTypeId(type);
  const slug = await makeUniqueSlug("events", title);

  const info = await dbRun(
    `INSERT INTO events (title, slug, event_date, event_time, description, type_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    title,
    slug,
    event_date,
    event_time,
    description,
    typeId
  );

  // DENORMALISASI: isi salinan type_name supaya daftar jadwal bisa dibaca tanpa JOIN.
  await syncEventDenormalized(info.lastInsertRowid);

  const typeKey = normalizeKey(type);
  if (typeKey === "perang" || typeKey === "perebutan") {
    const emoji = typeKey === "perang" ? "⚔️" : "🚩";
    await sendPushToAll(
      `${emoji} ${typeKey === "perang" ? "Peperangan" : "Perebutan Wilayah"}`,
      title,
      "/jadwal"
    );
  }

  return NextResponse.json({ ok: true, id: info.lastInsertRowid, slug });
}
