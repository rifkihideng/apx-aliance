import { NextResponse } from "next/server";
import { dbGet, dbRun, getEventTypeId, makeUniqueSlug, syncEventDenormalized } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import {
  normalizeDate,
  normalizeNullableMultiline,
  normalizeText,
  normalizeTime,
} from "@/lib/normalize";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const row = await dbGet("SELECT id FROM events WHERE id = ?", id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Jadwal tidak ditemukan." }, { status: 404 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  let newTitle: string | null = null;

  if (body.title !== undefined) {
    newTitle = normalizeText(body.title);
    if (!newTitle) {
      return NextResponse.json({ ok: false, error: "Judul tidak boleh kosong." }, { status: 400 });
    }
    fields.push("title = ?");
    values.push(newTitle);
  }
  if (body.event_date !== undefined) {
    const event_date = normalizeDate(body.event_date);
    if (!event_date) {
      return NextResponse.json(
        { ok: false, error: "Tanggal tidak valid (format YYYY-MM-DD)." },
        { status: 400 }
      );
    }
    fields.push("event_date = ?");
    values.push(event_date);
  }
  if (body.event_time !== undefined) {
    const event_time = normalizeTime(body.event_time);
    if (normalizeText(body.event_time) !== "" && !event_time) {
      return NextResponse.json(
        { ok: false, error: "Jam tidak valid (format HH:MM)." },
        { status: 400 }
      );
    }
    fields.push("event_time = ?");
    values.push(event_time);
  }
  if (body.description !== undefined) {
    fields.push("description = ?");
    values.push(normalizeNullableMultiline(body.description));
  }
  if (body.type !== undefined) {
    fields.push("type_id = ?");
    values.push(await getEventTypeId(normalizeText(body.type) || "event"));
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  // Slug mengikuti judul, jadi dibuat ulang saat judul berubah
  // (tetap unik lewat makeUniqueSlug -> "judul-2", "judul-3", ...).
  if (newTitle !== null) {
    fields.push("slug = ?");
    values.push(await makeUniqueSlug("events", newTitle, id));
  }

  values.push(id);
  const info = await dbRun(
    `UPDATE events SET ${fields.join(", ")}, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    ...values
  );

  // DENORMALISASI: segarkan salinan type_name setelah perubahan.
  if (info.changes > 0) await syncEventDenormalized(id);

  return NextResponse.json({ ok: true, changes: info.changes });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const info = await dbRun("DELETE FROM events WHERE id = ?", id);

  if (info.changes === 0) {
    return NextResponse.json({ ok: false, error: "Jadwal tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
