import { NextResponse } from "next/server";
import { dbGet, dbRun, getRoleId, getRankId, syncMemberDenormalized } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import {
  normalizeDate,
  normalizeDiscord,
  normalizeKey,
  normalizeLevel,
  normalizeNullable,
  normalizeText,
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
    const ign = normalizeText(body.ign);
    if (!ign) {
      return NextResponse.json({ ok: false, error: "In-game name (IGN) tidak boleh kosong." }, { status: 400 });
    }

    const ignKey = normalizeKey(ign);
    const dup = await dbGet(
      "SELECT id FROM members WHERE (ign_key = ? OR lower(ign) = ?) AND id != ? LIMIT 1",
      ignKey,
      ignKey,
      id
    );
    if (dup) {
      return NextResponse.json({ ok: false, error: "IGN sudah terdaftar." }, { status: 409 });
    }

    set("ign", ign);
    set("ign_key", ignKey);
  }
  if (body.role !== undefined) set("role_id", await getRoleId(normalizeText(body.role) || "Member"));
  if (body.pangkat !== undefined) {
    const pangkat = normalizeNullable(body.pangkat);
    set("rank_id", pangkat ? await getRankId(pangkat) : null);
  }
  if (body.discord !== undefined) {
    const discord = normalizeDiscord(body.discord);
    set("discord", discord);
    set("discord_key", discord ? normalizeKey(discord) : null);
  }
  if (body.joined_at !== undefined) {
    if (normalizeText(body.joined_at) === "") {
      set("joined_at", null);
    } else {
      const joined = normalizeDate(body.joined_at);
      if (!joined) {
        return NextResponse.json(
          { ok: false, error: "Tanggal bergabung tidak valid (format YYYY-MM-DD)." },
          { status: 400 }
        );
      }
      set("joined_at", joined);
    }
  }
  if (body.level !== undefined) set("level", normalizeLevel(body.level));
  if (body.active !== undefined) {
    set("active", body.active === true || body.active === 1 || body.active === "1" ? 1 : 0);
  }

  if (fields.length === 0) {
    return NextResponse.json({ ok: false, error: "Tidak ada perubahan." }, { status: 400 });
  }

  values.push(id);
  const info = await dbRun(
    `UPDATE members SET ${fields.join(", ")}, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    ...values
  );

  // DENORMALISASI: segarkan salinan role_name/rank_name setelah perubahan.
  if (info.changes > 0) await syncMemberDenormalized(id);

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
