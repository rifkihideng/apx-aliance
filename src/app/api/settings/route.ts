import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-server";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const wa_group_link = await getSetting("wa_group_link");
  return NextResponse.json({
    ok: true,
    settings: { wa_group_link },
  });
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

  const link = String(body.wa_group_link ?? "").trim();
  await setSetting("wa_group_link", link);

  return NextResponse.json({ ok: true });
}
