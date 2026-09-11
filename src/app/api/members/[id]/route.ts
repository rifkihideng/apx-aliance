import { NextResponse } from "next/server";
import { dbGet, dbRun, getRoleId, getRankId } from "@/lib/db";
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

  const row = await dbGet("SELECT id FROM members WHERE id = ?", id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Member tidak ditemukan." }, { status: 404 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  const set = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (body.ign !== undefined) {
    const ign = String(body.ign).trim();
    if (!ign) {
      return NextResponse.json({ ok: false, error: "In-game name (IGN) tidak boleh kosong." }, { status: 400 });
    }
    const dup = await dbGet("SELECT id FROM members WHERE lower(ign) = lower(?) AND id != ?", ign, id);
    if (dup) {
      return NextResponse.json({ ok: false, error: "IGN sudah terdaftar." }, { status: 409 });
    }
    set("ign", ign);
  }
  if (body.role !== undefined) set("role_id", await getRoleId(String(body.role).trim() || "Member"));
  if (body.pangkat !== undefined) {
    const pangkat = body.pangkat ? String(body.pangkat).trim() : null;
    set("rank_id", pangkat ? await getRankId(pangkat) : null);
  }
  if (body.discord !== undefined) set("discord", body.discord ? String(body.discord).trim() : null);
  if (body.joined_at !== undefined) set("joined_at", body.joined_at ? String(body.joined_at).trim() : null);
  if (body.level !== undefined) {
    const levelRaw = Number(body.level);
    set("level", Number.isFinite(levelRaw) && levelRaw > 0 ? Math.floor(levelRaw) : null);
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  values.push(id);
  const info = await dbRun(`UPDATE members SET ${fields.join(", ")} WHERE id = ?`, ...values);

  return NextResponse.json({ ok: true, changes: info.changes });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const info = await dbRun("DELETE FROM members WHERE id = ?", id);

  if (info.changes === 0) {
    return NextResponse.json({ ok: false, error: "Member tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
