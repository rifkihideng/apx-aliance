import { dbAll } from "@/lib/db";
import type { Lang } from "@/i18n/dictionaries";

export type MonthlyStat = {
  label: string;
  members: number;
  applications: number;
  events: number;
};

const MONTH_SHORT: Record<Lang, string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function lastMonthKeys(count: number, lang: Lang): { key: string; label: string }[] {
  const names = MONTH_SHORT[lang];
  const now = new Date();
  const result: { key: string; label: string }[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ key, label: `${names[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
  }

  return result;
}

function countByMonth(rows: { month: unknown; c: unknown }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = String(row.month ?? "");
    if (key) map.set(key, Number(row.c) || 0);
  }
  return map;
}

/**
 * Statistik bulanan sederhana untuk dashboard admin:
 * jumlah member baru, pendaftar masuk, dan event per bulan
 * (dalam `months` bulan terakhir, diisi 0 untuk bulan yang kosong).
 */
export async function getMonthlyStats(lang: Lang, months = 6): Promise<MonthlyStat[]> {
  const keys = lastMonthKeys(months, lang);

  const [memberRows, applicationRows, eventRows] = await Promise.all([
    dbAll<{ month: string; c: number }>(
      `SELECT substr(joined_at, 1, 7) AS month, COUNT(*) AS c
       FROM members
       WHERE joined_at IS NOT NULL AND joined_at <> ''
       GROUP BY substr(joined_at, 1, 7)`
    ),
    dbAll<{ month: string; c: number }>(
      `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS c
       FROM applications
       GROUP BY substr(created_at, 1, 7)`
    ),
    dbAll<{ month: string; c: number }>(
      `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS c
       FROM events
       GROUP BY substr(created_at, 1, 7)`
    ),
  ]);

  const members = countByMonth(memberRows);
  const applications = countByMonth(applicationRows);
  const events = countByMonth(eventRows);

  return keys.map(({ key, label }) => ({
    label,
    members: members.get(key) ?? 0,
    applications: applications.get(key) ?? 0,
    events: events.get(key) ?? 0,
  }));
}
