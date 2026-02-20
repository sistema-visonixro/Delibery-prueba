import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
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
  latitud?: number | null;
  longitud?: number | null;
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

interface PedidoHome {
  pedido_id: string;
  numero_pedido: string;
  total: number;
  estado: string;
  restaurante_nombre: string;
  restaurante_emoji: string;
  total_items: number;
  creado_en: string;
}

interface RestauranteCercano extends Restaurante {
  distanciaKm: number;
}

export default function HomeClient() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [restaurantesCercanos, setRestaurantesCercanos] = useState<
    RestauranteCercano[]
  >([]);
  const [ubicacionActual, setUbicacionActual] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pedidosActivos, setPedidosActivos] = useState<PedidoHome[]>([]);
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
            latitud:
              typeof r.latitud === "string"
                ? parseFloat(r.latitud) || null
                : (r.latitud ?? null),
            longitud:
              typeof r.longitud === "string"
                ? parseFloat(r.longitud) || null
                : (r.longitud ?? null),
          }));

          setRestaurantes(normalized);
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

  useEffect(() => {
    if (!usuario?.id) return;

    const estadosActivos = [
      "pendiente",
      "confirmado",
      "en_preparacion",
      "listo",
      "en_camino",
    ];

    const cargarPedidosActivos = async () => {
      try {
        const { data, error } = await supabase
          .from("vista_pedidos_cliente")
          .select(
            "pedido_id,numero_pedido,total,estado,restaurante_nombre,restaurante_emoji,total_items,creado_en",
          )
          .eq("usuario_id", usuario.id)
          .in("estado", estadosActivos)
          .order("creado_en", { ascending: false })
          .limit(4);

        if (error) throw error;
        setPedidosActivos((data as PedidoHome[]) || []);
      } catch (error) {
        console.error("Error cargando pedidos activos en home:", error);
        setPedidosActivos([]);
      }
    };

    cargarPedidosActivos();

    const channel = supabase
      .channel(`home-pedidos-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          cargarPedidosActivos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id]);

  useEffect(() => {
    if (!usuario?.id) return;

    const actualizarUbicacionCliente = async () => {
      if (!("geolocation" in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setUbicacionActual({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          const { error } = await supabase.from("ubicacion_real").upsert(
            {
              usuario_id: usuario.id,
              latitud: position.coords.latitude,
              longitud: position.coords.longitude,
              velocidad: position.coords.speed,
              precision_metros: Math.round(position.coords.accuracy),
              heading: position.coords.heading,
              actualizado_en: new Date().toISOString(),
            },
            {
              onConflict: "usuario_id",
            },
          );

          if (error) {
            console.error("Error actualizando ubicación en home:", error);
          }
        },
        () => {
          // evitar ruido de logs continuo si usuario niega permisos
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    };

    actualizarUbicacionCliente();
    const intervalo = setInterval(actualizarUbicacionCliente, 5000);

    return () => {
      clearInterval(intervalo);
    };
  }, [usuario?.id]);

  const calcularDistanciaKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const radioTierraKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radioTierraKm * c;
  };

  useEffect(() => {
    if (!ubicacionActual || restaurantes.length === 0) {
      setRestaurantesCercanos([]);
      return;
    }

    const conDistancia = restaurantes
      .filter((r) => r.latitud !== null && r.longitud !== null)
      .map((r) => ({
        ...r,
        distanciaKm: calcularDistanciaKm(
          ubicacionActual.latitude,
          ubicacionActual.longitude,
          Number(r.latitud),
          Number(r.longitud),
        ),
      }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm)
      .slice(0, 6);

    setRestaurantesCercanos(conDistancia);
  }, [restaurantes, ubicacionActual]);

  const obtenerTextoEstado = (estado: string) => {
    const textos: Record<string, string> = {
      pendiente: "Pendiente",
      confirmado: "Confirmado",
      en_preparacion: "Preparando",
      listo: "Listo",
      en_camino: "En camino",
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
    };

    return iconos[estado] || "📋";
  };

  const formatearFechaCompacta = (fecha: string) =>
    new Date(fecha).toLocaleString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });

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

        {pedidosActivos.length > 0 && (
          <section className="active-orders-section">
            <div className="section-header active-orders-header">
              <h2 className="section-title active-orders-title">
                <span className="section-icon">📦</span>
                Tus pedidos activos
              </h2>
              <button
                className="active-orders-link"
                onClick={() => navigate("/pedidos")}
              >
                Ver todos
              </button>
            </div>

            <div className="active-orders-grid">
              {pedidosActivos.map((pedido) => (
                <article
                  key={pedido.pedido_id}
                  className="active-order-card"
                  onClick={() => navigate(`/pedido/${pedido.pedido_id}`)}
                >
                  <div className="active-order-top">
                    <div className="active-order-restaurant">
                      <span className="active-order-emoji">
                        {pedido.restaurante_emoji || "🍽️"}
                      </span>
                      <div>
                        <h3 className="active-order-name">
                          {pedido.restaurante_nombre}
                        </h3>
                        <p className="active-order-number">
                          Pedido #{pedido.numero_pedido}
                        </p>
                      </div>
                    </div>

                    <div className="active-order-total">
                      L {Number(pedido.total || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="active-order-bottom">
                    <span className={`active-order-status status-${pedido.estado}`}>
                      <span>{obtenerIconoEstado(pedido.estado)}</span>
                      <span>{obtenerTextoEstado(pedido.estado)}</span>
                    </span>
                    <span className="active-order-meta">
                      {pedido.total_items} item{pedido.total_items > 1 ? "s" : ""}
                      • {formatearFechaCompacta(pedido.creado_en)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

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

        {/* Restaurantes Cerca de Ti */}
        <section className="nearby-restaurants-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">🍽️</span>
              Restaurantes cerca de ti
            </h2>
            <p className="section-subtitle">
              Te mostramos los más cercanos según tu ubicación actual
            </p>
          </div>

          <div className="nearby-restaurants-grid">
            {!ubicacionActual ? (
              <article className="nearby-restaurant-card nearby-empty-card">
                <p className="nearby-empty-text">
                  Activa tu ubicación para ver restaurantes cercanos.
                </p>
              </article>
            ) : restaurantesCercanos.length > 0 ? (
              restaurantesCercanos.map((restaurante) => (
                <article
                  key={restaurante.id}
                  onClick={() => navigate(`/restaurante/${restaurante.id}`)}
                  className="nearby-restaurant-card"
                >
                  <div className="nearby-card-top">
                    <div className="nearby-card-title-wrap">
                      <span className="nearby-card-emoji">
                        {restaurante.emoji || "🍽️"}
                      </span>
                      <div>
                        <h3 className="nearby-card-title">{restaurante.nombre}</h3>
                        <p className="nearby-card-subtitle">
                          {restaurante.tiempo_entrega_min || 30} min · L {Number(restaurante.costo_envio || 0).toFixed(2)} envío
                        </p>
                      </div>
                    </div>
                    <span className="nearby-distance-badge">
                      {restaurante.distanciaKm.toFixed(1)} km
                    </span>
                  </div>

                  <p className="nearby-card-description">
                    {restaurante.descripcion || "Restaurante disponible"}
                  </p>
                </article>
              ))
            ) : (
              <article className="nearby-restaurant-card nearby-empty-card">
                <p className="nearby-empty-text">
                  Aún no hay restaurantes con ubicación configurada.
                </p>
              </article>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
