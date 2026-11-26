"use client";

import { useMotionPreference } from "../../hooks/useMotionPreference";

// Layered, drifting smoke rendered with CSS radial gradients.
// - Multiple semi-transparent grey-white plumes
// - Slow horizontal drift
// - Soft blurred edges
// - Subtle lime-green ambient lighting
// - Sits behind all content (z-index 0, pointer-events none)
// - prefers-reduced-motion disables drift
// - Central dashboard area kept relatively clear via the radial vignette
export default function SmokeBackground() {
  const motion = useMotionPreference();

  return (
    <div className="dbb-smoke" aria-hidden="true">
      {/* Ambient lime base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(183, 243, 107, 0.08), transparent 65%)",
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
              "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(200, 215, 190, 0.07), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      )}
      {/* Keep the central dashboard area clear with a soft vignette */}
      <div className="dbb-smoke-vignette" />
    </div>
  );
}
