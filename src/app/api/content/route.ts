import { NextResponse } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { normalizeKey, normalizeNullable, normalizeText } from "@/lib/normalize";

const VALID_SECTIONS = ["faq", "rules"] as const;
type Section = (typeof VALID_SECTIONS)[number];

function parseSection(value: unknown): Section | null {
  const key = normalizeKey(value);
  return (VALID_SECTIONS as readonly string[]).includes(key) ? (key as Section) : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = parseSection(searchParams.get("section"));
  if (!section) {
    return NextResponse.json({ ok: false, error: "Section tidak valid." }, { status: 400 });
  }

  const items = await dbAll(
    "SELECT id, section, position, title_id, title_en, body_id, body_en FROM site_content WHERE section = ? ORDER BY position ASC, id ASC",
    section
  );
  return NextResponse.json({ ok: true, items });
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

  const section = parseSection(body.section);
  if (!section) {
    return NextResponse.json({ ok: false, error: "Section tidak valid." }, { status: 400 });
  }

  const title_id = normalizeText(body.title_id);
  if (!title_id) {
    return NextResponse.json({ ok: false, error: "Judul wajib diisi." }, { status: 400 });
  }

  const title_en = normalizeNullable(body.title_en);
  const body_id = normalizeNullable(body.body_id);
  const body_en = normalizeNullable(body.body_en);

  const posRow = await dbGet<{ p: number }>(
    "SELECT COALESCE(MAX(position), 0) + 1 AS p FROM site_content WHERE section = ?",
    section
  );
  const position = Number(posRow?.p ?? 1);

  const info = await dbRun(
    `INSERT INTO site_content (section, position, title_id, title_en, body_id, body_en, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    section,
    position,
    title_id,
    title_en,
    body_id,
    body_en
  );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
