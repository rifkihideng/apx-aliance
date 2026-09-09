import { NextResponse } from "next/server";
import { dbAll, dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";

export async function GET() {
  const events = await dbAll(
    "SELECT id, title, event_date, event_time, description, type, created_at FROM events ORDER BY event_date ASC, id DESC"
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

  const title = String(body.title ?? "").trim();
  const event_date = String(body.event_date ?? "").trim();
  const event_time = body.event_time ? String(body.event_time).trim() : null;
  const description = body.description ? String(body.description).trim() : null;
  const type = body.type ? String(body.type).trim() : "event";

  if (!title) {
    return NextResponse.json({ ok: false, error: "Judul wajib diisi." }, { status: 400 });
  }
  if (!event_date) {
    return NextResponse.json({ ok: false, error: "Tanggal wajib diisi." }, { status: 400 });
  }

  const info = await dbRun(
    "INSERT INTO events (title, event_date, event_time, description, type) VALUES (?, ?, ?, ?, ?)",
    title,
    event_date,
    event_time,
    description,
    type
  );

  if (type === "perang" || type === "perebutan") {
    const emoji = type === "perang" ? "⚔️" : "🚩";
    await sendPushToAll(
      `${emoji} ${type === "perang" ? "Peperangan" : "Perebutan Wilayah"}`,
      title,
      "/jadwal"
    );
  }

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
