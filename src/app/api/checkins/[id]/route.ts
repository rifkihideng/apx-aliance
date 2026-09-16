import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const info = await dbRun("DELETE FROM event_checkins WHERE id = ?", id);

  if (info.changes === 0) {
    return NextResponse.json({ ok: false, error: "Check-in tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
