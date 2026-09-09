export const ADMIN_COOKIE = "apx_admin";

const DEFAULT_PASSWORD = "apx2026";

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function verifyAdminPassword(password: string): boolean {
  return password === getPassword();
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminToken(): Promise<string> {
  return sha256(`apx-admin-session:${getPassword()}`);
}

export async function isValidAdminToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await sha256(`apx-admin-session:${getPassword()}`);
  return token === expected;
}
