import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import RestaurantCarousel from "../components/RestaurantCarousel";
import PlatillosCarousel from "../components/PlatillosCarousel";

interface Restaurante {
  id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  color_tema: string;
  emoji: string;
  calificacion: number;
  tiempo_entrega_min: number;
  costo_envio: number;
}

interface Categoria {
  id: string;
  nombre: string;
  emoji: string;
  color_gradiente_inicio: string;
  color_gradiente_fin: string;
}

interface Platillo {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio?: number;
  disponible?: boolean;
  restaurante_id?: string;
  restaurante?: { id: string; nombre: string } | null;
}

export default function HomeClient() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const { data: restaurantesData, error: errorRestaurantes } =
          await supabase
            .from("restaurantes")
            .select("*")
            .eq("activo", true)
            .order("calificacion", { ascending: false });

        if (errorRestaurantes) {
          console.error("Error cargando restaurantes:", errorRestaurantes);
          setRestaurantes([]);
        } else {
          const normalized = (restaurantesData || []).map((r: any) => ({
            ...r,
            calificacion:
              typeof r.calificacion === "string"
                ? parseFloat(r.calificacion) || 0
                : r.calificacion ?? 0,
            costo_envio:
              typeof r.costo_envio === "string"
                ? parseFloat(r.costo_envio) || 0
                : r.costo_envio ?? 0,
            tiempo_entrega_min: r.tiempo_entrega_min
              ? Number(r.tiempo_entrega_min)
              : 0,
          }));

          setRestaurantes(normalized);
        }

        const { data: categoriasData, error: errorCategorias } = await supabase
          .from("categorias")
          .select("*")
          .order("orden", { ascending: true });

        if (errorCategorias) {
          console.error("Error cargando categorías:", errorCategorias);
          setCategorias([
            {
              id: "1",
              nombre: "Comidas",
              emoji: "🍽️",
              color_gradiente_inicio: "#f093fb",
              color_gradiente_fin: "#f5576c",
            },
            {
              id: "2",
              nombre: "Bebidas",
              emoji: "🥤",
              color_gradiente_inicio: "#667eea",
              color_gradiente_fin: "#764ba2",
            },
            {
              id: "3",
              nombre: "Postres",
              emoji: "🍰",
              color_gradiente_inicio: "#fa709a",
              color_gradiente_fin: "#fee140",
            },
            {
              id: "4",
              nombre: "Mandaditos",
              emoji: "🛒",
              color_gradiente_inicio: "#4facfe",
              color_gradiente_fin: "#00f2fe",
            },
          ]);
        } else {
          setCategorias(categoriasData || []);
        }

        const { data: platillosData, error: errorPlatillos } = await supabase
          .from("platillos")
          .select(
            `id,nombre,descripcion,imagen_url,precio,disponible,restaurante_id,restaurantes(id,nombre)`
          )
          .order("nombre", { ascending: true })
          .limit(100);

        if (errorPlatillos) {
          console.error("Error cargando platillos:", errorPlatillos);
          setPlatillos([]);
        } else {
          const mapped = (platillosData || []).map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            imagen_url: p.imagen_url,
            precio: p.precio,
            disponible: p.disponible,
            restaurante_id: p.restaurante_id,
            restaurante: p.restaurantes
              ? Array.isArray(p.restaurantes)
                ? p.restaurantes[0]
                : p.restaurantes
              : null,
          }));
          setPlatillos(mapped);
        }
      } catch (error) {
        console.error("Error general:", error);
        setRestaurantes([]);
        setCategorias([]);
        setPlatillos([]);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const restMatches = restaurantes
      .filter((r) => `${r.nombre} ${r.descripcion}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((r) => ({
        type: "restaurante",
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        emoji: r.emoji,
      }));

    const platMatches = platillos
      .filter((p) => `${p.nombre} ${p.descripcion}`.toLowerCase().includes(q))
      .slice(0, 6 - restMatches.length)
      .map((p) => ({
        type: "platillo",
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        restaurante: p.restaurante,
      }));

    setSuggestions([...restMatches, ...platMatches]);
  }, [search, restaurantes, platillos]);

  // No mostrar pantalla de carga completa; renderizar layout y dejar que los
  // componentes manejen su estado (por ejemplo, RestaurantCarousel muestra
  // un mensaje cuando no hay restaurantes). Esto evita ocultar el `Header`
  // y el `BottomNav` durante la carga.

  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        paddingBottom: "20px",
        position: "relative",
      }}
    >
      <Header />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
        <RestaurantCarousel restaurantes={restaurantes} />

        <div style={{ marginTop: 12, marginBottom: 18, position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Buscar restaurantes o platillos..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e6e7eb",
              outline: "none",
              fontSize: 14,
            }}
          />

          {showSuggestions &&
            search.trim().length > 0 &&
            suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "rgba(255,255,255,0.98)",
                  border: "1px solid #e6e7eb",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
                  zIndex: 40,
                  maxHeight: 260,
                  overflow: "auto",
                }}
              >
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      if (s.type === "restaurante")
                        navigate(`/restaurante/${s.id}`);
                      else if (s.type === "platillo")
                        navigate(`/platillo/${s.id}`);
                    }}
                    style={{
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      cursor: "pointer",
                      borderBottom:
                        idx < suggestions.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {s.nombre}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        {s.type === "restaurante" ? "Restaurante" : "Platillo"}
                      </div>
                    </div>
                    {s.descripcion && (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        {s.descripcion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        <PlatillosCarousel
          platillos={platillos.sort(() => Math.random() - 0.5)}
        />

        <section>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "28px" }}>🍽️</span>
            ¿Qué se te antoja hoy?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "14px",
            }}
          >
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  onClick={() => navigate(`/categoria/${categoria.id}`)}
                  style={{
                    background: `linear-gradient(135deg, ${categoria.color_gradiente_inicio} 0%, ${categoria.color_gradiente_fin} 100%)`,
                    borderRadius: "16px",
                    padding: "20px 16px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 6px 18px rgba(102,126,234,0.3)",
                    minHeight: "140px",
                    clipPath: "ellipse(65% 60% at 30% 35%)",
                    WebkitClipPath: "ellipse(65% 60% at 30% 35%)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 8px 24px rgba(102,126,234,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 6px 18px rgba(102,126,234,0.3)";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-15px",
                      right: "-15px",
                      fontSize: "90px",
                      opacity: 0.15,
                    }}
                  >
                    {categoria.emoji}
                  </div>
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ fontSize: "40px", marginBottom: "8px" }}>
                      {categoria.emoji}
                    </div>
                    <h3
                      style={{
                        color: "#fff",
                        fontSize: "17px",
                        fontWeight: 700,
                        margin: "0 0 6px 0",
                      }}
                    >
                      {categoria.nombre}
                    </h3>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px",
                  padding: "20px 16px",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  minHeight: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  clipPath: "ellipse(65% 60% at 30% 35%)",
                  WebkitClipPath: "ellipse(65% 60% at 30% 35%)",
                }}
              >
                Cargando...
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />

      <style>{`@keyframes fadeIn {from { opacity: 0; } to { opacity: 1; }} @keyframes slideDown {from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); }}`}</style>
    </div>
  );
}
