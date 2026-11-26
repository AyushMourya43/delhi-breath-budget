import { Wind } from "lucide-react";

export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg, #F5EFE3)",
        color: "var(--text, #1A1A1A)",
        fontFamily: '"Inter", -apple-system, "Segoe UI", system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            background: "rgba(207, 227, 196, 0.58)",
            border: "1px solid rgba(62, 124, 79, 0.3)",
            color: "#3E7C4F",
          }}
        >
          <Wind size={22} />
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            margin: "0 auto 16px",
            border: "3px solid #E5E0D5",
            borderTopColor: "#3E7C4F",
            borderRadius: "50%",
            animation: "dbb-spin 0.8s linear infinite",
          }}
        />

        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Delhi Breath Budget
        </h2>
        <p style={{ color: "#6B7568", fontSize: 13, marginTop: 6 }}>
          Loading your dashboard…
        </p>

        <style>{`
          @keyframes dbb-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </main>
  );
}
