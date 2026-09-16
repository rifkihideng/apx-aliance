import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const checkins = await dbAll(
    `SELECT ck.id, ck.event_id, e.title AS event_title, ck.name, ck.discord, ck.created_at
     FROM event_checkins ck
     LEFT JOIN events e ON e.id = ck.event_id
     ORDER BY ck.id DESC`
  );

  return NextResponse.json({ ok: true, checkins });
}
