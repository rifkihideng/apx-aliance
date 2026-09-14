import { beforeEach, describe, expect, it } from "vitest";
import { clearRateLimit, getClientIp, rateLimit } from "./rate-limit";

// Pastikan fallback in-memory dipakai selama test.
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete (globalThis as Record<string, unknown>)._apxRate;
});

describe("getClientIp", () => {
  it("mengambil IP pertama dari x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("mengambil x-real-ip jika x-forwarded-for tidak ada", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("fallback ke 'local' tanpa header", () => {
    expect(getClientIp(new Request("http://localhost"))).toBe("local");
  });
});

describe("rateLimit (in-memory fallback)", () => {
  it("mengizinkan request sampai batas lalu menolak", async () => {
    const key = `test:${Date.now()}`;
    expect(await rateLimit(key, 3, 60_000)).toEqual({ allowed: true });
    expect(await rateLimit(key, 3, 60_000)).toEqual({ allowed: true });
    expect(await rateLimit(key, 3, 60_000)).toEqual({ allowed: true });

    const denied = await rateLimit(key, 3, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfter).toBeGreaterThan(0);
  });

  it("kunci berbeda tidak saling mempengaruhi", async () => {
    const a = `a:${Date.now()}`;
    const b = `b:${Date.now()}`;
    expect((await rateLimit(a, 1, 60_000)).allowed).toBe(true);
    expect((await rateLimit(b, 1, 60_000)).allowed).toBe(true);
  });
});

describe("clearRateLimit", () => {
  it("mengosongkan jejak kunci", async () => {
    const key = `clear:${Date.now()}`;
    await rateLimit(key, 1, 60_000);
    const denied = await rateLimit(key, 1, 60_000);
    expect(denied.allowed).toBe(false);

    await clearRateLimit(key);
    expect(await rateLimit(key, 1, 60_000)).toEqual({ allowed: true });
  });
});
