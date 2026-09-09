"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    function onMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function loop() {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      if (el) {
        el.style.transform = `translate3d(${x - 250}px, ${y - 250}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 h-[500px] w-[500px] rounded-full opacity-50 mix-blend-screen"
      style={{
        background:
          "radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.07) 40%, transparent 70%)",
      }}
    />
  );
}
