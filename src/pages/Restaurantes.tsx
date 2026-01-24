import { useState, useEffect } from "react";
import type { Restaurante } from "../types/restaurante.types";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Restaurantes.css";

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
    <div className="restaurantes-page">
      {/* Header */}
      <header className="restaurantes-header">
        <div className="header-content">
          <h1 className="page-title-rest">
            <span className="title-icon-rest">🍽️</span>
            Restaurantes
          </h1>
          <p className="page-subtitle-rest">
            Descubre los mejores lugares para comer
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper-rest">
          <span className="search-icon-rest">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="¿Qué se te antoja hoy?"
            className="search-input-rest"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="search-clear-rest"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="filter-chips-rest">
          {["Todos", "Mejor Valorados", "Envío Gratis", "Cerca de mí"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`filter-chip-rest ${activeFilter === f ? "active" : ""}`}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="restaurantes-main">
        {loading ? (
          <LoaderLayout />
        ) : filtrados.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="results-header">
              <h3 className="results-title">
                {activeFilter}
                <span className="results-count">({filtrados.length})</span>
              </h3>
            </div>
            <div className="restaurantes-grid">
              {filtrados.map((rest) => (
                <div
                  key={rest.id}
                  onClick={() => navigate(`/restaurante/${rest.id}`)}
                  className="restaurant-card"
                >
                  <div
                    className="restaurant-image"
                    style={{
                      backgroundImage: `url(${rest.imagen_url})`,
                    }}
                  >
                    <div className="image-overlay">
                      {rest.emoji && (
                        <span className="restaurant-emoji">{rest.emoji}</span>
                      )}
                    </div>
                  </div>

                  <div className="restaurant-info">
                    <h3 className="restaurant-name">{rest.nombre}</h3>
                    <p className="restaurant-description">
                      {rest.descripcion}
                    </p>

                   
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const LoaderLayout = () => (
  <div className="loader-container">
    <div className="loader-spinner" />
    <p className="loader-text">Cargando restaurantes...</p>
  </div>
);

const EmptyState = () => (
  <div className="empty-state-rest">
    <div className="empty-icon-rest">🍽️</div>
    <h3 className="empty-title-rest">Sin resultados</h3>
    <p className="empty-description-rest">
      Prueba buscando algo diferente como "Pizza" o "Sushi"
    </p>
  </div>
);
