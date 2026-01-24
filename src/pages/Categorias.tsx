import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  color_gradiente_inicio: string;
  color_gradiente_fin: string;
}

export default function Categorias() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("orden", { ascending: true });

      if (error) {
        console.error("Error cargando categorías:", error);
        setCategorias([]);
      } else {
        setCategorias(data || []);
      }
    } catch (err) {
      console.error(err);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}
    >
      {/* Header */}
      <header
        style={{
          background: "#fff",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#111827",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 28 }}>📑</span>
          Categorías
        </h1>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>Cargando...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48 }}>📂</div>
            <p style={{ color: "#6b7280", marginTop: 12 }}>
              No hay categorías disponibles
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 14,
            }}
          >
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                onClick={() => navigate(`/categoria/${categoria.id}`)}
                style={{
                  background: `linear-gradient(135deg, ${categoria.color_gradiente_inicio} 0%, ${categoria.color_gradiente_fin} 100%)`,
                  borderRadius: 16,
                  padding: "20px 16px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 6px 18px rgba(102,126,234,0.3)",
                  minHeight: 140,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(102,126,234,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 18px rgba(102,126,234,0.3)";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontSize: 48,
                    opacity: 0.25,
                  }}
                >
                  {categoria.emoji}
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    {categoria.emoji}
                  </span>
                  <h3
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 800,
                      margin: 0,
                      textShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {categoria.nombre}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
