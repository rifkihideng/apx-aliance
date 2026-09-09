import { NextResponse } from "next/server";
import { dbGet, dbRun, getSetting } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";

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

  const status = String(body.status ?? "");
  if (status !== "diterima" && status !== "ditolak") {
    return NextResponse.json({ ok: false, error: "Status tidak valid." }, { status: 400 });
  }

  const app = await dbGet<{ id: number; ign: string; level: number | null; discord: string | null }>(
    "SELECT id, ign, level, discord FROM applications WHERE id = ?",
    id
  );

  if (!app) {
    return NextResponse.json({ ok: false, error: "Pendaftar tidak ditemukan." }, { status: 404 });
  }

  await dbRun("UPDATE applications SET status = ? WHERE id = ?", status, id);

  if (status === "diterima") {
    const exists = await dbGet("SELECT id FROM members WHERE ign = ?", app.ign);
    if (!exists) {
      const now = new Date();
      const joined = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
      await dbRun(
        "INSERT INTO members (ign, role, pangkat, level, discord, joined_at) VALUES (?, ?, ?, ?, ?, ?)",
        app.ign,
        "Member",
        null,
        app.level,
        app.discord,
        joined
      );
    }

    const title = "Member Baru Bergabung 🎉";
    const waLink = await getSetting("wa_group_link");
    const content = waLink
      ? `Selamat datang ${app.ign} sebagai Member di APX Alliance!\nGabung grup WhatsApp: ${waLink}`
      : `Selamat datang ${app.ign} sebagai Member di APX Alliance!`;
    await dbRun("INSERT INTO announcements (title, content) VALUES (?, ?)", title, content);
    await sendPushToAll(title, content, "/berita");
  }

  return NextResponse.json({ ok: true });
}
