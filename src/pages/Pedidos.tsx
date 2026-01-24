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
      pendiente: "⏳ Pendiente",
      confirmado: "✅ Confirmado",
      en_preparacion: "👨‍🍳 En Preparación",
      listo: "📦 Listo",
      en_camino: "🚚 En Camino",
      entregado: "✅ Entregado",
      cancelado: "❌ Cancelado",
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="pedidos-page">
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "20rem",
          }}
        >
          <div className="loader" />
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-page">
      <Header />
      <div className="pedidos-wrapper">
        <h1
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          📦 Mis Pedidos
        </h1>

        {pedidos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
            }}
          >
            <p
              style={{
                color: "#6b7280",
                fontSize: "1.125rem",
                marginBottom: "1rem",
              }}
            >
              No tienes pedidos activos
            </p>
            <button
              onClick={() => navigate("/home")}
              style={{
                background: "#4f46e5",
                color: "#fff",
                padding: "0.5rem 1.25rem",
                borderRadius: 10,
                border: "none",
              }}
            >
              Hacer un Pedido
            </button>
          </div>
        ) : (
          <div className="pedidos-grid">
            {pedidos.map((pedido) => (
              <div
                key={pedido.pedido_id}
                onClick={() => navigate(`/pedido/${pedido.pedido_id}`)}
                className="pedido-card"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {pedido.restaurante_emoji} {pedido.restaurante_nombre}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Pedido #{pedido.numero_pedido}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "#4f46e5",
                      }}
                    >
                      L {pedido.total.toFixed(2)}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {pedido.total_items} item
                      {pedido.total_items > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span className="pedido-badge">
                    {obtenerTextoEstado(pedido.estado)}
                  </span>
                </div>

                {pedido.tiene_repartidor && pedido.repartidor_nombre && (
                  <div className="pedido-repartidor">
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#1e3a8a",
                        fontWeight: 600,
                      }}
                    >
                      🚚 Repartidor: {pedido.repartidor_nombre}
                    </p>
                  </div>
                )}

                {pedido.tracking_activo && (
                  <div className="pedido-tracking">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#3730a3",
                          fontWeight: 600,
                        }}
                      >
                        📍 Tracking en vivo disponible
                      </p>
                      <span
                        style={{
                          color: "#4f46e5",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                        }}
                      >
                        Ver mapa →
                      </span>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {new Date(pedido.creado_en).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
