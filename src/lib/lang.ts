import { cookies } from "next/headers";
import type { Lang } from "@/i18n/dictionaries";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get("lang")?.value;
  return value === "en" ? "en" : "id";
}
