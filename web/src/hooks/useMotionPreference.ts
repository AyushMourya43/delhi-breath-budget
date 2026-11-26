"use client";

import { useEffect, useState } from "react";

// Tiny hook — respects prefers-reduced-motion.
// Returns true when motion is allowed (i.e. NOT reduced).
export function useMotionPreference(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return allowed;
}
