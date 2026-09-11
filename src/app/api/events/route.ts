import { NextResponse } from "next/server";
import { dbAll, dbRun, getEventTypeId } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";

export async function GET() {
  const events = await dbAll(
    "SELECT e.id, e.title, e.event_date, e.event_time, e.description, et.name AS type, e.created_at FROM events e JOIN event_types et ON et.id = e.type_id ORDER BY e.event_date ASC, e.id DESC"
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

  const typeId = await getEventTypeId(type);

  const info = await dbRun(
    "INSERT INTO events (title, event_date, event_time, description, type_id) VALUES (?, ?, ?, ?, ?)",
    title,
    event_date,
    event_time,
    description,
    typeId
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
