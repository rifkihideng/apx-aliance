import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const applications = await dbAll(
    "SELECT id, ign, level, discord, alasan, status, created_at FROM applications ORDER BY id DESC"
  );

  return NextResponse.json({ ok: true, applications });
}
