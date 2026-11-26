import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--bg, #F5EFE3)",
        color: "var(--text, #1A1A1A)",
        fontFamily: '"Inter", -apple-system, "Segoe UI", system-ui, sans-serif',
        textAlign: "center",
      }}
    >
      <section style={{ maxWidth: 420 }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 18px",
            display: "grid",
            placeItems: "center",
            borderRadius: 14,
            background: "rgba(207, 227, 196, 0.58)",
            border: "1px solid rgba(62, 124, 79, 0.3)",
            color: "#3E7C4F",
          }}
        >
          <Compass size={28} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 6px" }}>
          404 — Page not found
        </h1>
        <p style={{ color: "#6B7568", fontSize: 13, lineHeight: 1.7 }}>
          That route {"isn't"} on the map. Head back to the dashboard.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 18,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 18px",
            borderRadius: 8,
            background: "#3E7C4F",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
