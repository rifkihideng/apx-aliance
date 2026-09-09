const globalForRate = globalThis as unknown as { _rateHits?: Map<string, number[]> };

function getStore(): Map<string, number[]> {
  if (!globalForRate._rateHits) {
    globalForRate._rateHits = new Map();
  }
  return globalForRate._rateHits;
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "local";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const store = getStore();
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    store.set(key, hits);
    const oldest = hits[0];
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { allowed: false, retryAfter };
  }

  hits.push(now);
  store.set(key, hits);
  return { allowed: true };
}

export function clearRateLimit(key: string): void {
  getStore().delete(key);
}
