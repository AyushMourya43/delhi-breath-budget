"use client";

import { useMotionPreference } from "../../hooks/useMotionPreference";

// Subtle, slow-moving organic color washes behind dashboard content.
export default function SmokeBackground() {
  const motion = useMotionPreference();

  return (
    <div className="dbb-smoke" aria-hidden="true">
      {/* Warm sage ambient wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(127, 176, 105, 0.08), transparent 65%)",
        }}
      />
      {motion ? (
        <>
          <div className="dbb-smoke-layer dbb-smoke-1" />
          <div className="dbb-smoke-layer dbb-smoke-2" />
          <div className="dbb-smoke-layer dbb-smoke-3" />
          <div className="dbb-smoke-layer dbb-smoke-4" />
        </>
      ) : (
        // Static fallback — single blurred blob, no animation
        <div
          style={{
            position: "absolute",
            inset: "-10%",
            background:
              "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(168, 203, 160, 0.08), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      )}
      {/* Keep the central dashboard area clear */}
      <div className="dbb-smoke-vignette" />
    </div>
  );
}
