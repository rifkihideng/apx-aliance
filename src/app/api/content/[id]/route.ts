import { NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { normalizeNullable, normalizeText } from "@/lib/normalize";

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

  const row = await dbGet<{ id: number; section: string; position: number }>(
    "SELECT id, section, position FROM site_content WHERE id = ?",
    id
  );
  if (!row) {
    return NextResponse.json({ ok: false, error: "Item tidak ditemukan." }, { status: 404 });
  }

  // Reorder: tukar posisi dengan tetangga atas/bawah dalam section yang sama.
  if (body.direction === "up" || body.direction === "down") {
    const neighbor = await dbGet<{ id: number; position: number }>(
      body.direction === "up"
        ? "SELECT id, position FROM site_content WHERE section = ? AND position < ? ORDER BY position DESC LIMIT 1"
        : "SELECT id, position FROM site_content WHERE section = ? AND position > ? ORDER BY position ASC LIMIT 1",
      row.section,
      row.position
    );

    if (neighbor) {
      await dbRun("UPDATE site_content SET position = ? WHERE id = ?", neighbor.position, row.id);
      await dbRun("UPDATE site_content SET position = ? WHERE id = ?", row.position, neighbor.id);
    }
    return NextResponse.json({ ok: true });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  const set = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (body.title_id !== undefined) {
    const title_id = normalizeText(body.title_id);
    if (!title_id) {
      return NextResponse.json({ ok: false, error: "Judul tidak boleh kosong." }, { status: 400 });
    }
    set("title_id", title_id);
  }
  if (body.title_en !== undefined) set("title_en", normalizeNullable(body.title_en));
  if (body.body_id !== undefined) set("body_id", normalizeNullable(body.body_id));
  if (body.body_en !== undefined) set("body_en", normalizeNullable(body.body_en));

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  values.push(id);
  const info = await dbRun(
    `UPDATE site_content SET ${fields.join(", ")}, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    ...values
  );

  return NextResponse.json({ ok: true, changes: info.changes });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const info = await dbRun("DELETE FROM site_content WHERE id = ?", id);
  if (info.changes === 0) {
    return NextResponse.json({ ok: false, error: "Item tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
