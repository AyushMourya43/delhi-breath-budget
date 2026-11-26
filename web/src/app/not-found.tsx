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
        background: "var(--bg, #101312)",
        color: "var(--text, #F2F4EF)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
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
            background: "rgba(183, 243, 107, 0.1)",
            border: "1px solid rgba(183, 243, 107, 0.3)",
            color: "#B7F36B",
          }}
        >
          <Compass size={28} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 6px" }}>
          404 — Page not found
        </h1>
        <p style={{ color: "#9BA59D", fontSize: 13, lineHeight: 1.7 }}>
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
            background: "#B7F36B",
            color: "#101312",
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
