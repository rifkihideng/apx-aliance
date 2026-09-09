import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";

export async function GET() {
  const announcements = await dbAll(
    "SELECT id, title, content, created_at FROM announcements ORDER BY id DESC"
  );
  return NextResponse.json({ ok: true, announcements });
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

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!title) {
    return NextResponse.json({ ok: false, error: "Judul wajib diisi." }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ ok: false, error: "Isi berita wajib diisi." }, { status: 400 });
  }

  const info = await dbRun("INSERT INTO announcements (title, content) VALUES (?, ?)", title, content);

  await sendPushToAll(`📢 ${title}`, content, "/berita");

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
