import { Wind } from "lucide-react";

export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg, #101312)",
        color: "var(--text, #F2F4EF)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
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
            background: "rgba(183, 243, 107, 0.12)",
            border: "1px solid rgba(183, 243, 107, 0.35)",
            color: "#B7F36B",
          }}
        >
          <Wind size={22} />
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            margin: "0 auto 16px",
            border: "3px solid #252D24",
            borderTopColor: "#B7F36B",
            borderRadius: "50%",
            animation: "dbb-spin 0.8s linear infinite",
          }}
        />

        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Delhi Breath Budget
        </h2>
        <p style={{ color: "#9BA59D", fontSize: 13, marginTop: 6 }}>
          Loading your dashboard…
        </p>

        <style>{`
          @keyframes dbb-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </main>
  );
}
