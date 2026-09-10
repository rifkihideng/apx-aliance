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
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(`${date}T${time ?? "00:00"}`).getTime();
  const diff = Math.max(0, target - (now ?? target));

  const cells = [
    { value: Math.floor(diff / 86_400_000), label: labels.days },
    { value: Math.floor(diff / 3_600_000) % 24, label: labels.hours },
    { value: Math.floor(diff / 60_000) % 60, label: labels.mins },
    { value: Math.floor(diff / 1_000) % 60, label: labels.secs },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex w-20 flex-col items-center rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-4"
        >
          <span className="font-mono text-3xl font-black text-emerald-400 tabular-nums">
            {String(cell.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
