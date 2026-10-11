"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function AnimatedNumber({
  value,
  durationMs = 900,
}: {
  value: number;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const target = useMemo(() => Math.max(0, Math.floor(value)), [value]);
  const reduce = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    if (reduce) return;

    let raf = 0;
    const start = performance.now();
    const from = display;
    const delta = target - from;

    function tick(now: number) {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, reduce]);

  return <span>{(reduce ? target : display).toLocaleString()}</span>;
}

