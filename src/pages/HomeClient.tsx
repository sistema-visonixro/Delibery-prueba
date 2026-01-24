import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import RestaurantCarousel from "../components/RestaurantCarousel";
import PlatillosCarousel from "../components/PlatillosCarousel";
import "./HomeClient.css";

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
                : (r.calificacion ?? 0),
            costo_envio:
              typeof r.costo_envio === "string"
                ? parseFloat(r.costo_envio) || 0
                : (r.costo_envio ?? 0),
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
          ]);
        } else {
          const categoriasFiltradas = (categoriasData || []).filter(
            (cat) => cat.nombre.toLowerCase() !== "mandaditos",
          );
          setCategorias(categoriasFiltradas);
        }

        const { data: platillosData, error: errorPlatillos } = await supabase
          .from("platillos")
          .select(
            `id,nombre,descripcion,imagen_url,precio,disponible,restaurante_id,restaurantes(id,nombre)`,
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

  return (
    <div className="home-page">
      <Header />

      <main className="home-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                ¡Bienvenido a <span className="hero-highlight">Delibery</span>!
              </h1>
              <p className="hero-subtitle">
                Descubre los mejores restaurantes y platillos cerca de ti
              </p>
            </div>
            <div className="hero-emoji">🍕</div>
          </div>
        </section>

        {/* Search Bar Mejorada */}
        <div className="search-container">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Buscar restaurantes o platillos..."
              className="search-input"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="search-clear"
              >
                ✕
              </button>
            )}
          </div>

          {showSuggestions &&
            search.trim().length > 0 &&
            suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      if (s.type === "restaurante")
                        navigate(`/restaurante/${s.id}`);
                      else if (s.type === "platillo")
                        navigate(`/platillo/${s.id}`);
                    }}
                    className="suggestion-item"
                  >
                    <div className="suggestion-header">
                      <div className="suggestion-name">
                        {s.type === "restaurante" && s.emoji && (
                          <span className="suggestion-emoji">{s.emoji}</span>
                        )}
                        {s.nombre}
                      </div>
                      <span className="suggestion-type">
                        {s.type === "restaurante" ? "Restaurante" : "Platillo"}
                      </span>
                    </div>
                    {s.descripcion && (
                      <div className="suggestion-description">
                        {s.descripcion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Restaurantes Carousel */}
        <RestaurantCarousel restaurantes={restaurantes} />

        {/* Platillos Carousel */}
        <PlatillosCarousel
          platillos={platillos.sort(() => Math.random() - 0.5)}
        />

        {/* Categorías Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">🍽️</span>
              ¿Qué se te antoja hoy?
            </h2>
            <p className="section-subtitle">
              Explora nuestras categorías más populares
            </p>
          </div>

          <div className="categories-grid">
            {categorias.length > 0 ? (
              categorias.map((categoria, index) => (
                <div
                  key={categoria.id}
                  onClick={() => navigate(`/categoria/${categoria.id}`)}
                  className="category-card"
                  style={{
                    background: `linear-gradient(135deg, ${categoria.color_gradiente_inicio} 0%, ${categoria.color_gradiente_fin} 100%)`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="category-emoji-bg">
                    {categoria.emoji}
                  </div>
                  <div className="category-content">
                    <div className="category-emoji-main">
                      {categoria.emoji}
                    </div>
                    <h3 className="category-name">{categoria.nombre}</h3>
                    <div className="category-arrow">→</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="category-card category-loading">
                <div className="loading-spinner"></div>
                <p>Cargando categorías...</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
