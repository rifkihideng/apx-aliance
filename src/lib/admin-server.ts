import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return isValidAdminToken(token);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) {
    redirect("/admin/login");
  }
}
