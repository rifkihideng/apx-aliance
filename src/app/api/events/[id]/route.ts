import { NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

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

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "Judul tidak boleh kosong." }, { status: 400 });
    }
    fields.push("title = ?");
    values.push(title);
  }
  if (body.event_date !== undefined) {
    const event_date = String(body.event_date).trim();
    if (!event_date) {
      return NextResponse.json({ ok: false, error: "Tanggal tidak boleh kosong." }, { status: 400 });
    }
    fields.push("event_date = ?");
    values.push(event_date);
  }
  if (body.event_time !== undefined) {
    fields.push("event_time = ?");
    values.push(body.event_time ? String(body.event_time).trim() : null);
  }
  if (body.description !== undefined) {
    fields.push("description = ?");
    values.push(body.description ? String(body.description).trim() : null);
  }
  if (body.type !== undefined) {
    fields.push("type = ?");
    values.push(body.type ? String(body.type).trim() : "event");
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  values.push(id);
  const info = await dbRun(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`, ...values);
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
