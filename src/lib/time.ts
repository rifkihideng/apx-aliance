export type TimeZones = {
  wib: string;
  wita: string;
  wit: string;
  utc: string;
};

export function convertTimeZones(time: string | null | undefined): TimeZones | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);

  const fmt = (hour: number) => {
    const hh = ((hour % 24) + 24) % 24;
    return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return {
    wib: fmt(h),
    wita: fmt(h + 1),
    wit: fmt(h + 2),
    utc: fmt(h - 7),
  };
}

export function formatTimeZones(time: string | null | undefined): string {
  const z = convertTimeZones(time);
  if (!z) return "";
  return `${z.wib} WIB · ${z.wita} WITA · ${z.wit} WIT · ${z.utc} UTC`;
}
