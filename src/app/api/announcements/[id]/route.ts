import { NextResponse } from "next/server";
import { dbGet, dbRun, makeUniqueSlug } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { normalizeMultiline, normalizeText } from "@/lib/normalize";

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

  const row = await dbGet("SELECT id FROM announcements WHERE id = ?", id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Berita tidak ditemukan." }, { status: 404 });
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
  if (body.content !== undefined) {
    const content = normalizeMultiline(body.content);
    if (!content) {
      return NextResponse.json({ ok: false, error: "Isi berita tidak boleh kosong." }, { status: 400 });
    }
    fields.push("content = ?");
    values.push(content);
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  // Slug mengikuti judul, dibuat ulang saat judul berubah.
  if (newTitle !== null) {
    fields.push("slug = ?");
    values.push(await makeUniqueSlug("announcements", newTitle, id));
  }

  values.push(id);
  const info = await dbRun(
    `UPDATE announcements SET ${fields.join(", ")}, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    ...values
  );
  return NextResponse.json({ ok: true, changes: info.changes });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const info = await dbRun("DELETE FROM announcements WHERE id = ?", id);

  if (info.changes === 0) {
    return NextResponse.json({ ok: false, error: "Berita tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
