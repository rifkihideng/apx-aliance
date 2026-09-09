import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
import { clearRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (!verifyAdminPassword(password)) {
    const rl = rateLimit(`login-fail:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Terlalu banyak percobaan login. Coba lagi 15 menit lagi." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 900) } }
      );
    }
    return NextResponse.json({ ok: false, error: "Password salah." }, { status: 401 });
  }

  clearRateLimit(`login-fail:${ip}`);

  const token = await createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
