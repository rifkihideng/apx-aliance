"use client";

import { useEffect, useState } from "react";

type CountdownLabels = {
  days: string;
  hours: string;
  mins: string;
  secs: string;
};

export default function Countdown({
  date,
  time,
  labels,
}: {
  date: string;
  time: string | null;
  labels: CountdownLabels;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  // Waktu event disimpan dalam WIB (UTC+7), jadi target dihitung dengan offset
  // tetap agar countdown benar untuk pengunjung di zona waktu lain.
  const target = new Date(`${date}T${time ?? "00:00"}+07:00`).getTime();
  const diff = Math.max(0, target - (now ?? target));

  const cells = [
    { value: Math.floor(diff / 86_400_000), label: labels.days },
    { value: Math.floor(diff / 3_600_000) % 24, label: labels.hours },
    { value: Math.floor(diff / 60_000) % 60, label: labels.mins },
    { value: Math.floor(diff / 1_000) % 60, label: labels.secs },
  ];

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-4 gap-2 sm:gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center rounded-xl border border-zinc-700 bg-zinc-950 px-1 py-3 sm:py-4"
        >
          <span className="font-mono text-2xl font-black text-emerald-400 tabular-nums sm:text-3xl">
            {String(cell.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-xs">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
