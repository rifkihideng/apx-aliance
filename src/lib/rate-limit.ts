import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitResult = { allowed: boolean; retryAfter?: number };

type RateStore = {
  memoryHits: Map<string, number[]>;
  redis: Redis | null;
  redisInitialized: boolean;
  limiters: Map<string, Ratelimit>;
};

const globalForRate = globalThis as unknown as { _apxRate?: RateStore };

function getStore(): RateStore {
  if (!globalForRate._apxRate) {
    globalForRate._apxRate = {
      memoryHits: new Map(),
      redis: null,
      redisInitialized: false,
      limiters: new Map(),
    };
  }
  return globalForRate._apxRate;
}

/**
 * Ambil client Redis Upstash (hanya jika env lengkap).
 * Dijaga satu instance per proses supaya koneksi dipakai ulang.
 */
function getRedis(): Redis | null {
  const store = getStore();
  if (!store.redisInitialized) {
    store.redisInitialized = true;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      store.redis = Redis.fromEnv();
    }
  }
  return store.redis;
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const store = getStore();
  const id = `${limit}:${windowMs}`;
  let limiter = store.limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "apx-rate",
      timeout: 5000,
    });
    store.limiters.set(id, limiter);
  }
  return limiter;
}

function memoryRateLimit(
  store: RateStore,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const hits = (store.memoryHits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    store.memoryHits.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    return { allowed: false, retryAfter };
  }

  hits.push(now);
  store.memoryHits.set(key, hits);
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "local";
}

/**
 * Rate limiting per kunci.
 *
 * - Jika `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` tersedia,
 *   pakai Upstash Redis (persisten & konsisten antar serverless instance).
 * - Jika tidak ada, fallback ke in-memory (cukup untuk development).
 * - Jika Upstash error, otomatis fallback ke in-memory supaya request tetap
 *   tidak terblokir total.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const store = getStore();
  const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    try {
      const res = await limiter.limit(key);
      if (res.success) return { allowed: true };
      const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
      return { allowed: false, retryAfter };
    } catch (error) {
      console.warn("[rate-limit] Upstash error, fallback ke in-memory:", error);
    }
  }

  return memoryRateLimit(store, key, limit, windowMs);
}

/** Hapus jejak kunci (mis. setelah login berhasil). */
export async function clearRateLimit(key: string): Promise<void> {
  const store = getStore();
  store.memoryHits.delete(key);
  await Promise.all(
    [...store.limiters.values()].map((limiter) =>
      limiter.resetUsedTokens(key).catch(() => {})
    )
  );
}
