export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f7fb",
        color: "#172238",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            margin: "0 auto 16px",
            border: "4px solid #dce7ee",
            borderTopColor: "#0d9488",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />

        <h2>Delhi Breath Budget</h2>
        <p style={{ color: "#748096" }}>
          Loading your dashboard...
        </p>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </main>
  );
}