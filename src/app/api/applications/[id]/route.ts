import { NextResponse } from "next/server";
import {
  dbGet,
  dbRun,
  getSetting,
  getRoleId,
  makeUniqueSlug,
  syncMemberDenormalized,
} from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";
import { sendPushToAll } from "@/lib/push";
import {
  normalizeApplicationStatus,
  normalizeDiscord,
  normalizeKey,
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

  const status = normalizeApplicationStatus(body.status);
  if (!status) {
    return NextResponse.json({ ok: false, error: "Status tidak valid." }, { status: 400 });
  }

  const app = await dbGet<{
    id: number;
    ign: string;
    ign_key: string | null;
    level: number | null;
    discord: string | null;
  }>("SELECT id, ign, ign_key, level, discord FROM applications WHERE id = ?", id);

  if (!app) {
    return NextResponse.json({ ok: false, error: "Pendaftar tidak ditemukan." }, { status: 404 });
  }

  await dbRun(
    "UPDATE applications SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
    status,
    id
  );

  if (status === "diterima") {
    const ign = normalizeText(app.ign);
    const ignKey = app.ign_key ?? normalizeKey(app.ign);
    const discord = normalizeDiscord(app.discord);

    // Cek duplikat pakai bentuk kanonik (sama seperti POST /api/members).
    const exists = await dbGet(
      "SELECT id FROM members WHERE ign_key = ? OR lower(ign) = ? LIMIT 1",
      ignKey,
      ignKey
    );

    if (!exists) {
      const now = new Date();
      const joined = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;

      try {
        const inserted = await dbRun(
          `INSERT INTO members (ign, ign_key, role_id, level, discord, discord_key, joined_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
          ign,
          ignKey,
          await getRoleId("Member"),
          app.level,
          discord,
          discord ? normalizeKey(discord) : null,
          joined
        );

        // DENORMALISASI: isi salinan role_name untuk member baru ini.
        await syncMemberDenormalized(inserted.lastInsertRowid);
      } catch (error) {
        // Jangan gagalkan proses approve hanya karena member sudah ada.
        console.warn("[applications] Gagal menambah member dari lamaran:", error);
      }
    }

    const title = "Member Baru Bergabung 🎉";
    const waLink = await getSetting("wa_group_link");
    const content = waLink
      ? `Selamat datang ${ign} sebagai Member di APX Alliance!\nGabung grup WhatsApp: ${waLink}`
      : `Selamat datang ${ign} sebagai Member di APX Alliance!`;

    const slug = await makeUniqueSlug("announcements", `${title} ${ign}`);
    await dbRun(
      "INSERT INTO announcements (title, slug, content) VALUES (?, ?, ?)",
      title,
      slug,
      content
    );
    await sendPushToAll(title, content, "/berita");
  }

  return NextResponse.json({ ok: true });
}
