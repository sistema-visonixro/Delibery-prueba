import { useState, useEffect } from "react";
import type { Restaurante } from "../types/restaurante.types";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ... interfaces se mantienen igual

export default function Restaurantes() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  useEffect(() => {
    cargarRestaurantes();
  }, []);

  async function cargarRestaurantes() {
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("activo", true)
        .order("calificacion", { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((r: any) => ({
        ...r,
        calificacion: parseFloat(r.calificacion) || 0,
        costo_envio: parseFloat(r.costo_envio) || 0,
        tiempo_entrega_min: Number(r.tiempo_entrega_min) || 0,
      }));
      setRestaurantes(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtrados = restaurantes.filter((r) => {
    const matchSearch = `${r.nombre} ${r.descripcion}`
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeFilter === "Mejor Valorados")
      return matchSearch && r.calificacion >= 4.5;
    if (activeFilter === "Envío Gratis")
      return matchSearch && r.costo_envio === 0;
    return matchSearch;
  });

  return (
    <div
      style={{ minHeight: "100vh", background: "#fcfcfd", paddingBottom: 100 }}
    >
      {/* Header Estilo Neumórfico Suave */}
      <header style={headerStyle}>
        <div style={topBarStyle}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#94a3b8",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Entregar en
            </p>
            <h2 style={{ margin: 0, fontSize: 16, color: "#1e293b" }}>
              📍 Mi Ubicación ▼
            </h2>
          </div>
          <div style={avatarCircle}>
            {restaurantes.length > 0 ? "⚡" : "⏳"}
          </div>
        </div>

        <div style={searchWrapper}>
          <span style={searchIcon}>🔍</span>
          <input
            id="search-antoja"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="¿Qué se te antoja hoy?"
            style={{ ...searchInputStyle, color: "#000" }}
          />
          <style>{`#search-antoja::placeholder { color: #000 !important; opacity: 1; }`}</style>
        </div>

        {/* Chips de Filtrado */}
        <div style={filterScrollStyle}>
          {["Todos", "Mejor Valorados", "Envío Gratis", "Cerca de mí"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  ...chipStyle,
                  background: activeFilter === f ? "#1e293b" : "#fff",
                  color: activeFilter === f ? "#fff" : "#64748b",
                  border:
                    activeFilter === f
                      ? "1px solid #1e293b"
                      : "1px solid #e2e8f0",
                }}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </header>

      {/* Grid de Contenido */}
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        {loading ? (
          <LoaderLayout />
        ) : filtrados.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: -5,
              }}
            >
              {activeFilter} ({filtrados.length})
            </h3>
            {filtrados.map((rest) => (
              <div
                key={rest.id}
                onClick={() => navigate(`/restaurante/${rest.id}`)}
                style={cardStyle}
              >
                <div
                  style={{
                    ...cardImageStyle,
                    backgroundImage: `url(${rest.imagen_url})`,
                  }}
                >
                  <div style={imageOverlayStyle}>
                    <div style={timeBadgeStyle}>
                      🕒 {rest.tiempo_entrega_min} min
                    </div>
                  </div>
                  <div style={emojiCircle}>{rest.emoji}</div>
                </div>

                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h3 style={cardTitleStyle}>{rest.nombre}</h3>
                    <div style={ratingBadge}>
                      ⭐ {rest.calificacion.toFixed(1)}
                    </div>
                  </div>
                  <p style={cardDescStyle}>{rest.descripcion}</p>

                  <div style={cardFooterStyle}>
                    <div
                      style={{
                        color: rest.costo_envio === 0 ? "#059669" : "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {rest.costo_envio === 0
                        ? "Envío GRATIS"
                        : `Costo envío: $${rest.costo_envio}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Estilos de UI ---

const headerStyle: React.CSSProperties = {
  background: "#fff",
  padding: "20px 16px",
  position: "sticky",
  top: 0,
  zIndex: 100,
  borderBottom: "1px solid #f1f5f9",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const avatarCircle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
};

const searchWrapper: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};
const searchIcon: React.CSSProperties = {
  position: "absolute",
  left: 14,
  fontSize: 16,
  opacity: 0.5,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px 14px 44px",
  borderRadius: "16px",
  border: "none",
  background: "#f1f5f9",
  outline: "none",
  fontSize: 15,
  fontWeight: 500,
};

const filterScrollStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  marginTop: 16,
  paddingBottom: 4,
  scrollbarWidth: "none",
};

const chipStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "100px",
  border: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "0.2s",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  cursor: "pointer",
  border: "1px solid #f1f5f9",
};

const cardImageStyle: React.CSSProperties = {
  height: 180,
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const imageOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
  display: "flex",
  alignItems: "flex-end",
  padding: 12,
};

const timeBadgeStyle: React.CSSProperties = {
  background: "#fff",
  padding: "6px 12px",
  borderRadius: "12px",
  fontSize: 12,
  fontWeight: 800,
  color: "#1e293b",
};

const emojiCircle: React.CSSProperties = {
  position: "absolute",
  bottom: -15,
  right: 20,
  width: 45,
  height: 45,
  background: "#fff",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#1e293b",
  margin: 0,
};
const cardDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
  margin: "8px 0 16px 0",
  lineHeight: 1.4,
};

const ratingBadge: React.CSSProperties = {
  background: "#fffbeb",
  color: "#b45309",
  padding: "4px 8px",
  borderRadius: "8px",
  fontWeight: 800,
  fontSize: 13,
  border: "1px solid #fef3c7",
};

const cardFooterStyle: React.CSSProperties = {
  paddingTop: 12,
  borderTop: "1px solid #f8fafc",
  fontSize: 13,
};

const LoaderLayout = () => (
  <div style={{ textAlign: "center", padding: "100px 0" }}>
    <div className="spinner" />
    <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #1e293b; border-radius: 50%; animation: s 1s infinite linear; margin: 0 auto } @keyframes s { to { transform: rotate(1turn) } }`}</style>
  </div>
);

const EmptyState = () => (
  <div style={{ textAlign: "center", padding: "100px 20px" }}>
    <div style={{ fontSize: 60 }}>🍽️</div>
    <h3 style={{ color: "#1e293b" }}>Sin resultados</h3>
    <p style={{ color: "#94a3b8" }}>
      Prueba buscando algo diferente como "Pizza" o "Sushi"
    </p>
  </div>
);
