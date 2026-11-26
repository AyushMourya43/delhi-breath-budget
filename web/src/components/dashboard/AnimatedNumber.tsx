"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  // When true (default), respects prefers-reduced-motion and snaps to final value.
  respectReducedMotion?: boolean;
}

// Animated numerical transition. Uses requestAnimationFrame; respects
// prefers-reduced-motion. Falls back gracefully during SSR.
export default function AnimatedNumber({
  value,
  durationMs = 1100,
  decimals = 0,
  suffix = "",
  prefix = "",
  respectReducedMotion = true,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value);
  const fromRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const reduceMotion =
      respectReducedMotion &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    startRef.current = 0;

    const step = (ts: number) => {
      if (startRef.current === 0) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs, respectReducedMotion]);

  const formatted = display.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}
