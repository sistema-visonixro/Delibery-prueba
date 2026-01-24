import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import "./Pedidos.css";

interface Pedido {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  restaurante_nombre: string;
  restaurante_emoji: string;
  tiene_repartidor: boolean;
  tracking_activo: boolean;
  repartidor_nombre: string | null;
  creado_en: string;
  total_items: number;
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarPedidos();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("mis-pedidos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `usuario_id=eq.${usuario?.id}`,
        },
        () => {
          cargarPedidos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id]);

  const cargarPedidos = async () => {
    if (!usuario?.id) return;

    try {
      const { data, error } = await supabase
        .from("vista_pedidos_cliente")
        .select("*")
        .eq("usuario_id", usuario.id)
        .order("creado_en", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    const textos: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      en_preparacion: "En Preparación",
      listo: "Listo",
      en_camino: "En Camino",
      entregado: "Entregado",
      cancelado: "Cancelado",
    };
    return textos[estado] || estado;
  };

  const obtenerIconoEstado = (estado: string) => {
    const iconos: Record<string, string> = {
      pendiente: "⏳",
      confirmado: "✅",
      en_preparacion: "👨‍🍳",
      listo: "📦",
      en_camino: "🚚",
      entregado: "✅",
      cancelado: "❌",
    };
    return iconos[estado] || "📋";
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleFiltro =
      filtroEstado === "todos" || pedido.estado === filtroEstado;
    const cumpleBusqueda =
      busqueda === "" ||
      pedido.numero_pedido.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.restaurante_nombre.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  // Contar pedidos por estado
  const contarPorEstado = (estado: string) => {
    if (estado === "todos") return pedidos.length;
    return pedidos.filter((p) => p.estado === estado).length;
  };

  const estadosActivos = ["en_camino", "listo", "en_preparacion", "confirmado"];
  const pedidosActivos = pedidos.filter((p) =>
    estadosActivos.includes(p.estado),
  );

  if (loading) {
    return (
      <div className="pedidos-page">
        <Header />
        <div className="loading-container">
          <div className="loader" />
          <p className="loading-text">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-page">
      <Header />
      <div className="pedidos-wrapper">
        {/* Header con estadísticas */}
        <div className="pedidos-header">
          <div>
            <h1 className="page-title">
              <span className="title-icon">📦</span>
              Mis Pedidos
            </h1>
            <p className="page-subtitle">
              {pedidosActivos.length > 0
                ? `Tienes ${pedidosActivos.length} pedido${pedidosActivos.length > 1 ? "s" : ""} activo${pedidosActivos.length > 1 ? "s" : ""}`
                : "Historial de pedidos"}
            </p>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h2 className="empty-title">No tienes pedidos aún</h2>
            <p className="empty-description">
              ¡Explora nuestros restaurantes y haz tu primer pedido!
            </p>
            <button onClick={() => navigate("/home")} className="cta-button">
              <span>🍽️</span>
              Explorar Restaurantes
            </button>
          </div>
        ) : (
          <>
            {/* Barra de búsqueda y filtros */}
            <div className="search-filter-container">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por número o restaurante..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="clear-search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-chips">
                <button
                  onClick={() => setFiltroEstado("todos")}
                  className={`filter-chip ${filtroEstado === "todos" ? "active" : ""}`}
                >
                  Todos
                  <span className="chip-count">{contarPorEstado("todos")}</span>
                </button>
                <button
                  onClick={() => setFiltroEstado("en_camino")}
                  className={`filter-chip ${filtroEstado === "en_camino" ? "active" : ""}`}
                >
                  🚚 En Camino
                  <span className="chip-count">
                    {contarPorEstado("en_camino")}
                  </span>
                </button>
                <button
                  onClick={() => setFiltroEstado("en_preparacion")}
                  className={`filter-chip ${filtroEstado === "en_preparacion" ? "active" : ""}`}
                >
                  👨‍🍳 Preparando
                  <span className="chip-count">
                    {contarPorEstado("en_preparacion")}
                  </span>
                </button>
                <button
                  onClick={() => setFiltroEstado("entregado")}
                  className={`filter-chip ${filtroEstado === "entregado" ? "active" : ""}`}
                >
                  ✅ Entregados
                  <span className="chip-count">
                    {contarPorEstado("entregado")}
                  </span>
                </button>
              </div>
            </div>

            {/* Grid de pedidos */}
            {pedidosFiltrados.length === 0 ? (
              <div className="no-results">
                <p className="no-results-icon">🔍</p>
                <p className="no-results-text">
                  No se encontraron pedidos con estos filtros
                </p>
                <button
                  onClick={() => {
                    setFiltroEstado("todos");
                    setBusqueda("");
                  }}
                  className="reset-filters-btn"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="pedidos-grid">
                {pedidosFiltrados.map((pedido) => (
                  <div
                    key={pedido.pedido_id}
                    onClick={() => navigate(`/pedido/${pedido.pedido_id}`)}
                    className="pedido-card"
                  >
                    {/* Header del card */}
                    <div className="card-header">
                      <div className="restaurant-info">
                        <span className="restaurant-emoji">
                          {pedido.restaurante_emoji}
                        </span>
                        <div>
                          <h3 className="restaurant-name">
                            {pedido.restaurante_nombre}
                          </h3>
                          <p className="order-number">
                            Pedido #{pedido.numero_pedido}
                          </p>
                        </div>
                      </div>
                      <div className="order-total">
                        <p className="total-amount">L {pedido.total.toFixed(2)}</p>
                        <p className="total-items">
                          {pedido.total_items} item
                          {pedido.total_items > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Estado del pedido */}
                    <div className={`status-badge status-${pedido.estado}`}>
                      <span className="status-icon">
                        {obtenerIconoEstado(pedido.estado)}
                      </span>
                      <span className="status-text">
                        {obtenerTextoEstado(pedido.estado)}
                      </span>
                    </div>

                    {/* Información del repartidor */}
                    {pedido.tiene_repartidor && pedido.repartidor_nombre && (
                      <div className="delivery-info">
                        <span className="delivery-icon">🚚</span>
                        <span className="delivery-text">
                          {pedido.repartidor_nombre}
                        </span>
                      </div>
                    )}

                    {/* Tracking activo */}
                    {pedido.tracking_activo && (
                      <div className="tracking-badge">
                        <span className="tracking-pulse"></span>
                        <span className="tracking-text">
                          📍 Seguimiento en vivo
                        </span>
                        <span className="tracking-arrow">→</span>
                      </div>
                    )}

                    {/* Footer con fecha */}
                    <div className="card-footer">
                      <span className="order-date">
                        🕒{" "}
                        {new Date(pedido.creado_en).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
