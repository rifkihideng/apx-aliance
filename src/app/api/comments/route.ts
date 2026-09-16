import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const comments = await dbAll(
    `SELECT c.id, c.announcement_id, a.title AS announcement_title, c.name, c.message, c.approved, c.created_at
     FROM comments c
     LEFT JOIN announcements a ON a.id = c.announcement_id
     ORDER BY c.id DESC`
  );

  return NextResponse.json({ ok: true, comments });
}
