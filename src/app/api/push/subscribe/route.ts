import { NextResponse } from "next/server";
import { dbRun } from "@/lib/db";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const subscription = body.subscription as
    | { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    | undefined;
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "Subscription tidak valid." }, { status: 400 });
  }

  await dbRun(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    endpoint,
    p256dh,
    auth
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const endpoint = String(body.endpoint ?? "");
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "Endpoint wajib diisi." }, { status: 400 });
  }

  await dbRun("DELETE FROM push_subscriptions WHERE endpoint = ?", endpoint);

  return NextResponse.json({ ok: true });
}
