export default function Header() {

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "linear-gradient(135deg, #2e1065, #1e1b4b)",
          padding: "12px 14px 14px", // menos alto
          boxShadow: "0 2px 8px rgba(30, 27, 75, 0.18)",
          clipPath: "ellipse(100% 75% at 50% 10%)", // curva más sutil
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          {/* Logo + Título */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src="/logo.png"
              alt="Delibery"
              style={{ height: 36, borderRadius: "10px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
              }}
            >
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                Food Delibery Roatan
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 2,
                }}
              >
                Tu comida, más cerca
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
